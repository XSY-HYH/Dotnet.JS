using System.Collections;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Jint;
using Jint.Native;
using Jint.Native.Array;
using Jint.Native.Boolean;
using Jint.Native.Function;
using Jint.Native.Number;
using Jint.Native.Object;

namespace Dotnet.JS.Runtime;

// JsValue 与 CLR 对象双向转换
internal static class JsValueConverter
{
    public static JsValue ToJsValue(Engine engine, object? value)
    {
        if (value == null) return JsValue.Null;
        if (value is JsValue jv) return jv;

        switch (value)
        {
            case bool b: return b ? JsBoolean.True : JsBoolean.False;
            case int i: return (JsValue)i;
            case uint u: return (JsValue)u;
            case long l: return (JsValue)l;
            case ulong ul: return (JsValue)ul;
            case short s: return (JsValue)(int)s;
            case ushort us: return (JsValue)(int)us;
            case byte by: return (JsValue)(int)by;
            case sbyte sb: return (JsValue)(int)sb;
            case float f: return (JsValue)(double)f;
            case double d: return (JsValue)d;
            case decimal dec: return (JsValue)(double)dec;
            case string str: return (JsValue)str;
            case char c: return (JsValue)c.ToString();
            case Guid g: return (JsValue)g.ToString();
            case Uri uri: return (JsValue)uri.ToString();
        }

        // DateTime/TimeSpan 保留实例，方便调用实例方法如 ToString(format)
        if (value is Enum enumVal)
            return ToJsValue(engine, Convert.ChangeType(enumVal, enumVal.GetTypeCode(), CultureInfo.InvariantCulture));

        if (value is Type t)
            return (JsValue)(t.FullName ?? t.Name);

        if (value is Array arr)
        {
            var jsArray = new JsArray(engine);
            foreach (var item in arr)
                jsArray.Push(ToJsValue(engine, item));
            return jsArray;
        }

        if (value is IEnumerable enumerable and not string)
        {
            // 泛型集合转 JsArray，非泛型 IEnumerable（如 XmlDocument/XmlNode）保留 ObjectWrapper
            // 泛型字典与 KeyValuePair 集合也保留 ObjectWrapper，避免丢失键值语义和 CLR 身份
            // 覆盖 IQueryCollection/IHeaderDictionary/FormCollection 等需 callInstance 调索引器的类型
            var vtype = value.GetType();
            bool isGenericCollection = false;
            bool keepWrapper = false;
            foreach (var iface in vtype.GetInterfaces())
            {
                if (!iface.IsGenericType) continue;
                var def = iface.GetGenericTypeDefinition();
                if (def == typeof(IEnumerable<>))
                {
                    isGenericCollection = true;
                    var argType = iface.GetGenericArguments()[0];
                    if (argType.IsGenericType && argType.GetGenericTypeDefinition() == typeof(KeyValuePair<,>))
                        keepWrapper = true;
                }
                if (def == typeof(IDictionary<,>) || def == typeof(IReadOnlyDictionary<,>))
                    keepWrapper = true;
            }
            if (isGenericCollection && !keepWrapper)
            {
                var jsArray = new JsArray(engine);
                foreach (var item in enumerable)
                    jsArray.Push(ToJsValue(engine, item));
                return jsArray;
            }
        }

        if (value is IDictionary dict)
        {
            var jsObj = new JsObject(engine);
            foreach (DictionaryEntry entry in dict)
                jsObj.Set(entry.Key?.ToString() ?? "", ToJsValue(engine, entry.Value));
            return jsObj;
        }

        if (value is Task task)
        {
            task.Wait();
            var resultProp = task.GetType().GetProperty("Result");
            if (resultProp != null)
                return ToJsValue(engine, resultProp.GetValue(task));
            return JsValue.Undefined;
        }

        try
        {
            return JsValue.FromObject(engine, value);
        }
        catch
        {
            return (JsValue)(value.ToString() ?? "");
        }
    }

    public static object? ToClrValue(JsValue value, Type? targetType = null)
    {
        if (value == null || value.IsNull())
            return targetType?.IsValueType == true && Nullable.GetUnderlyingType(targetType) == null
                ? Activator.CreateInstance(targetType) : null;

        if (value.IsUndefined())
            return targetType?.IsValueType == true && Nullable.GetUnderlyingType(targetType) == null
                ? Activator.CreateInstance(targetType) : null;

        targetType ??= typeof(object);

        if (targetType == typeof(object)) return value.ToObject();
        if (targetType == typeof(JsValue)) return value;

        // 委托类型：JS 函数适配为目标委托
        if (targetType.IsSubclassOf(typeof(Delegate)) && value.IsCallable())
            return CreateDelegateAdapter(targetType, value);

        if (targetType == typeof(bool))
            return value.AsBoolean();

        if (targetType == typeof(string))
            return value.AsString();

        if (targetType == typeof(char))
        {
            var s = value.IsString() ? value.AsString() : value.ToString();
            return s.Length > 0 ? s[0] : '\0';
        }

        if (value.IsNumber())
        {
            double num = value.AsNumber();
            if (targetType == typeof(int)) return (int)num;
            if (targetType == typeof(long)) return (long)num;
            if (targetType == typeof(short)) return (short)num;
            if (targetType == typeof(byte)) return (byte)num;
            if (targetType == typeof(sbyte)) return (sbyte)num;
            if (targetType == typeof(uint)) return (uint)num;
            if (targetType == typeof(ulong)) return (ulong)num;
            if (targetType == typeof(ushort)) return (ushort)num;
            if (targetType == typeof(float)) return (float)num;
            if (targetType == typeof(double)) return num;
            if (targetType == typeof(decimal)) return (decimal)num;
        }

        if (targetType.IsEnum)
        {
            if (value.IsNumber())
                return Enum.ToObject(targetType, (long)value.AsNumber());
            if (value.IsString())
                return Enum.Parse(targetType, value.AsString(), true);
        }

        if (value is JsArray jsArr)
        {
            var elemType = targetType.IsArray
                ? targetType.GetElementType()
                : targetType.IsGenericType ? targetType.GetGenericArguments()[0] : typeof(object);

            var list = new List<object?>();
            var len = (int)jsArr.Length;
            for (int i = 0; i < len; i++)
                list.Add(ToClrValue(GetArrayItem(jsArr, i), elemType));

            if (targetType.IsArray)
            {
                var arr = Array.CreateInstance(elemType!, list.Count);
                for (int i = 0; i < list.Count; i++)
                    arr.SetValue(list[i], i);
                return arr;
            }
            if (targetType.IsGenericType && targetType.GetGenericTypeDefinition() == typeof(List<>))
                return typeof(List<>).MakeGenericType(elemType!)
                    .GetConstructor(new[] { typeof(IEnumerable<>).MakeGenericType(elemType!) })?
                    .Invoke(new object[] { list }) ?? list;
            return list;
        }

        if (value is JsObject jsObj && targetType.IsGenericType
            && targetType.GetGenericTypeDefinition() == typeof(Dictionary<,>)
            && targetType.GetGenericArguments()[0] == typeof(string))
        {
            var vType = targetType.GetGenericArguments()[1];
            var dict = (IDictionary)Activator.CreateInstance(targetType)!;
            foreach (var key in jsObj.GetOwnProperties())
            {
                if (key.Key.IsString())
                    dict[key.Key.AsString()] = ToClrValue(key.Value.Value, vType);
            }
            return dict;
        }

        try
        {
            return Convert.ChangeType(value.ToObject(), targetType, CultureInfo.InvariantCulture);
        }
        catch
        {
            return value.ToObject();
        }
    }

    // JsArray 按 int 索引取元素
    public static JsValue GetArrayItem(JsArray arr, int index)
    {
        return arr.Get((ulong)index);
    }

    // JS 函数适配为 CLR 委托，参数和返回值自动双向转换
    private static Delegate CreateDelegateAdapter(Type delegateType, JsValue function)
    {
        var func = function.AsFunctionInstance();
        var engine = func.Engine;
        var invokeMethod = delegateType.GetMethod("Invoke")!;
        var paramTypes = invokeMethod.GetParameters().Select(p => p.ParameterType).ToArray();
        var returnType = invokeMethod.ReturnType;

        var paramExprs = paramTypes.Select((t, i) => Expression.Parameter(t, $"p{i}")).ToArray();

        // CLR 参数转 JsValue
        var engineConst = Expression.Constant(engine);
        var jsArgs = paramExprs.Select(p => Expression.Call(
            typeof(JsValueConverter),
            nameof(ToJsValue),
            null,
            engineConst,
            Expression.Convert(p, typeof(object)))).ToArray();

        // 调用 JsValueExtensions.Call(function, Undefined, jsArgs)
        var funcConst = Expression.Constant(function, typeof(JsValue));
        var undefinedConst = Expression.Field(null, typeof(JsValue), "Undefined");
        var jsArrayConst = Expression.NewArrayInit(typeof(JsValue), jsArgs);
        var callMethod = typeof(JsValueExtensions).GetMethod(
            "Call", new[] { typeof(JsValue), typeof(JsValue), typeof(JsValue[]) })!;
        var callExpr = Expression.Call(callMethod, funcConst, undefinedConst, jsArrayConst);

        Expression body;
        if (returnType == typeof(void))
        {
            body = callExpr;
        }
        else if (returnType == typeof(System.Threading.Tasks.Task))
        {
            // RequestDelegate 等返回 Task 的委托，JS 同步执行完返回 CompletedTask
            var completedTask = Expression.Property(null, typeof(System.Threading.Tasks.Task), "CompletedTask");
            body = Expression.Block(callExpr, completedTask);
        }
        else
        {
            // 返回的 JsValue 转 CLR 类型
            var toClrCall = Expression.Call(
                typeof(JsValueConverter),
                nameof(ToClrValue),
                null,
                callExpr,
                Expression.Constant(returnType, typeof(Type)));
            body = Expression.Convert(toClrCall, returnType);
        }

        var lambda = Expression.Lambda(delegateType, body, paramExprs);
        return lambda.Compile();
    }
}
