using System.Globalization;
using System.Reflection;
using Jint;
using Jint.Native;
using Jint.Native.Array;
using Jint.Native.Function;

namespace Dotnet.JS.Runtime;

// 重载决议，基于 JsValue 直接打分选最佳方法
internal static class MethodBinder
{
    // 旧 API 兼容：单数组传参时按需展开
    // callStatic('Exists', ['test.txt']) 会被识别成 spread 调用
    public static JsValue[] MaybeExpandArray(JsValue[] args, MethodBase[] candidates)
    {
        if (args.Length != 1 || !args[0].IsArray()) return args;
        var jsArr = args[0].AsArray();
        var arrLen = (int)jsArr.Length;
        foreach (var c in candidates)
        {
            var pars = c.GetParameters();
            if (pars.Length == arrLen)
                return ExpandJsArray(jsArr, arrLen);
            // params 可变参数
            if (pars.Length > 0 && pars[^1].GetCustomAttribute<ParamArrayAttribute>() != null
                && arrLen >= pars.Length - 1)
                return ExpandJsArray(jsArr, arrLen);
        }
        return args;
    }

    private static JsValue[] ExpandJsArray(JsArray jsArr, int len)
    {
        var expanded = new JsValue[len];
        for (int i = 0; i < len; i++)
            expanded[i] = jsArr.Get((ulong)i);
        return expanded;
    }

    public static MethodInfo? SelectBest(MethodInfo[] candidates, JsValue[] args)
    {
        MethodInfo? best = null;
        int bestScore = -1;
        foreach (var m in candidates)
        {
            var pars = m.GetParameters();
            if (!ArgsCountMatches(pars, args.Length)) continue;
            int score = Score(pars, args);
            if (score < 0) continue;
            if (score > bestScore)
            {
                bestScore = score;
                best = m;
            }
        }
        return best;
    }

    public static ConstructorInfo? SelectCtor(ConstructorInfo[] candidates, JsValue[] args)
    {
        ConstructorInfo? best = null;
        int bestScore = -1;
        foreach (var c in candidates)
        {
            var pars = c.GetParameters();
            if (!ArgsCountMatches(pars, args.Length)) continue;
            int score = Score(pars, args);
            if (score < 0) continue;
            if (score > bestScore)
            {
                bestScore = score;
                best = c;
            }
        }
        return best;
    }

    private static bool ArgsCountMatches(ParameterInfo[] pars, int argCount)
    {
        if (pars.Length == argCount) return true;
        if (pars.Length > 0 && pars[^1].GetCustomAttribute<ParamArrayAttribute>() != null
            && argCount >= pars.Length - 1) return true;
        if (argCount >= pars.Length && pars.Any(p => p.HasDefaultValue)) return true;
        return false;
    }

    private static int Score(ParameterInfo[] pars, JsValue[] args)
    {
        int total = 0;
        for (int i = 0; i < pars.Length; i++)
        {
            var pType = pars[i].ParameterType;
            var isParams = pars[i].GetCustomAttribute<ParamArrayAttribute>() != null;
            var isOptional = pars[i].HasDefaultValue;

            if (i >= args.Length)
            {
                if (isOptional) continue;
                if (isParams) continue;
                return -1;
            }

            var arg = args[i];
            if (isParams && pType.IsArray)
            {
                var elemType = pType.GetElementType()!;
                if (arg is JsArray jsArr)
                {
                    // 整个 params 当数组传
                    int sub = 0;
                    var len = (int)jsArr.Length;
                    for (int j = 0; j < len; j++)
                    {
                        int s = ScoreArg(elemType, jsArr.Get((ulong)j));
                        if (s < 0) return -1;
                        sub += s;
                    }
                    total += sub;
                }
                else
                {
                    // spread 调用，剩余参数各自匹配 elemType
                    int sub = 0;
                    for (int j = i; j < args.Length; j++)
                    {
                        int s = ScoreArg(elemType, args[j]);
                        if (s < 0) return -1;
                        sub += s;
                    }
                    total += sub;
                }
                continue;
            }

            int score = ScoreArg(pType, arg);
            if (score < 0) return -1;
            total += score;
        }
        return total;
    }

    private static int ScoreArg(Type pType, JsValue jv)
    {
        if (jv.IsNull() || jv.IsUndefined())
            return (!pType.IsValueType || Nullable.GetUnderlyingType(pType) != null) ? 50 : -1;

        if (jv.IsBoolean())
            return pType == typeof(bool) ? 100 : (pType == typeof(object) ? 10 : -1);

        if (jv.IsNumber())
        {
            double num = jv.AsNumber();
            bool isInt = num == Math.Floor(num) && !double.IsInfinity(num) && !double.IsNaN(num);
            bool isNeg = num < 0;
            if (pType == typeof(int)) return isInt ? 95 : -1;
            if (pType == typeof(long)) return isInt ? 92 : -1;
            if (pType == typeof(short)) return isInt && num >= -32768 && num <= 32767 ? 90 : -1;
            if (pType == typeof(sbyte)) return isInt && num >= -128 && num <= 127 ? 88 : -1;
            if (pType == typeof(double)) return 85;
            if (pType == typeof(float)) return 80;
            if (pType == typeof(decimal)) return isInt ? 82 : 80;
            if (pType == typeof(uint)) return isInt && !isNeg ? 85 : -1;
            if (pType == typeof(ulong)) return isInt && !isNeg ? 82 : -1;
            if (pType == typeof(ushort)) return isInt && !isNeg && num <= 65535 ? 80 : -1;
            if (pType == typeof(byte)) return isInt && !isNeg && num <= 255 ? 78 : -1;
            if (pType.IsEnum) return 70;
            if (pType == typeof(object)) return 10;
            return -1;
        }

        if (jv.IsString())
        {
            if (pType == typeof(string)) return 100;
            if (pType == typeof(char)) return 60;
            if (pType.IsEnum) return 70;
            if (pType == typeof(object)) return 10;
            return -1;
        }

        if (jv.IsArray())
        {
            if (pType.IsArray) return 80;
            if (pType == typeof(object)) return 10;
            if (IsEnumerableOfT(pType)) return 70;
            return -1;
        }

        // 委托类型：JS 函数可适配
        if (pType.IsSubclassOf(typeof(Delegate)) && jv is Function)
            return 75;
        // Delegate 基类参数对 JS 函数打低分，具体委托重载优先
        if (pType == typeof(Delegate) && jv is Function)
            return 70;

        var clrObj = jv.ToObject();
        if (clrObj == null) return -1;
        var aType = clrObj.GetType();
        if (pType.IsAssignableFrom(aType)) return 80;
        if (pType == typeof(object)) return 10;
        return -1;
    }

    private static bool IsNumeric(Type t)
    {
        return t == typeof(int) || t == typeof(long) || t == typeof(short) || t == typeof(byte)
            || t == typeof(uint) || t == typeof(ulong) || t == typeof(ushort) || t == typeof(sbyte)
            || t == typeof(float) || t == typeof(double) || t == typeof(decimal);
    }

    private static bool IsEnumerableOfT(Type t)
    {
        if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(IEnumerable<>)) return true;
        return t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));
    }

    // 按方法签名把 JsValue[] 转成 object[]
    public static object?[] CoerceArgs(MethodBase method, JsValue[] args)
    {
        var pars = method.GetParameters();
        var result = new List<object?>(pars.Length);

        for (int i = 0; i < pars.Length; i++)
        {
            var pType = pars[i].ParameterType;
            var isParams = pars[i].GetCustomAttribute<ParamArrayAttribute>() != null;

            if (isParams)
            {
                var elemType = pType.GetElementType()!;
                var rest = new List<object?>();
                // 单个数组当整体传，展开数组元素
                if (args.Length - i == 1 && args[i].IsArray())
                {
                    var jsArr = args[i].AsArray();
                    var len = (int)jsArr.Length;
                    for (int j = 0; j < len; j++)
                        rest.Add(JsValueConverter.ToClrValue(jsArr.Get((ulong)j), elemType));
                }
                else
                {
                    for (int j = i; j < args.Length; j++)
                        rest.Add(JsValueConverter.ToClrValue(args[j], elemType));
                }
                var arr = Array.CreateInstance(elemType, rest.Count);
                for (int k = 0; k < rest.Count; k++) arr.SetValue(rest[k], k);
                result.Add(arr);
                break;
            }

            if (i >= args.Length)
            {
                result.Add(pars[i].DefaultValue);
                continue;
            }

            result.Add(JsValueConverter.ToClrValue(args[i], pType));
        }

        return result.ToArray();
    }

    public static string DescribeArgs(JsValue[] args)
    {
        return string.Join(", ", args.Select(a =>
        {
            if (a.IsNull() || a.IsUndefined()) return "null";
            if (a.IsBoolean()) return "bool";
            if (a.IsNumber()) return "number";
            if (a.IsString()) return "string";
            if (a.IsArray()) return "array";
            return a.ToObject()?.GetType().Name ?? "object";
        }));
    }
}
