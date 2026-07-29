using System.Reflection;
using System.Reflection.Emit;
using System.Runtime.InteropServices;
using Jint;
using Jint.Native;
using Jint.Runtime;
using Jint.Runtime.Interop;
using Dotnet.JS.Runtime;

namespace Dotnet.JS.Interop;

// Native 库互操作，用 Reflection.Emit 动态构造非泛型委托调用 native 函数
// 旧实现用 Expression.GetDelegateType 生成泛型 Func<>，GetDelegateForFunctionPointer 不接受
internal static class NativeInterop
{
    // IntPtr 包装，让句柄在 JS 侧有可识别身份
    internal sealed class NativeHandle
    {
        public IntPtr Value { get; }
        public NativeHandle(IntPtr value) { Value = value; }
        public override string ToString() => $"native:0x{Value.ToInt64():X}";
    }

    private static readonly Dictionary<string, Type> _delegateCache = new();

    public static void Register(Engine engine)
    {
        engine.SetValue("__native_load", new Func<string, NativeHandle>(name =>
        {
            try { return new NativeHandle(NativeLibrary.Load(name)); }
            catch (Exception ex)
            {
                throw new JavaScriptException(engine.Intrinsics.Error,
                    $"native_load failed for '{name}': {ex.Message}");
            }
        }));

        engine.SetValue("__native_get_proc", new Func<NativeHandle, string, NativeHandle>((h, procName) =>
        {
            try { return new NativeHandle(NativeLibrary.GetExport(h.Value, procName)); }
            catch (Exception ex)
            {
                throw new JavaScriptException(engine.Intrinsics.Error,
                    $"native_get_proc failed for '{procName}': {ex.Message}");
            }
        }));

        engine.SetValue("__native_call", new ClrFunction(engine, "__native_call",
            (thisObj, args) =>
            {
                if (args.Length < 3)
                    throw new JavaScriptException(engine.Intrinsics.Error,
                        "__native_call needs (handle, argTypes, args, returnType?)");
                var handle = ToHandle(engine, args[0]);
                var argTypes = ToStringArray(engine, args[1]);
                var rawArgs = ToObjectArray(engine, args[2]);
                var retType = args.Length > 3 && args[3].IsString() ? args[3].AsString() : "void";
                var callArgs = CoerceArgs(rawArgs, argTypes);
                try
                {
                    var result = InvokeNative(handle.Value, argTypes, callArgs, retType);
                    return JsValueConverter.ToJsValue(engine, result);
                }
                catch (Exception ex)
                {
                    throw new JavaScriptException(engine.Intrinsics.Error,
                        $"native_call failed: {ex.Message}");
                }
            }));

        engine.SetValue("__native_ptr_to_string", new Func<NativeHandle, string>(h =>
            Marshal.PtrToStringAnsi(h.Value) ?? ""));
        engine.SetValue("__native_ptr_to_wstring", new Func<NativeHandle, string>(h =>
            Marshal.PtrToStringUni(h.Value) ?? ""));
        engine.SetValue("__native_free", new Action<NativeHandle>(h =>
            NativeLibrary.Free(h.Value)));
    }

    private static NativeHandle ToHandle(Engine engine, JsValue v)
    {
        if (v.ToObject() is NativeHandle h) return h;
        throw new JavaScriptException(engine.Intrinsics.Error, "expected native handle");
    }

    private static string[] ToStringArray(Engine engine, JsValue v)
    {
        if (!v.IsArray())
            throw new JavaScriptException(engine.Intrinsics.Error, "argTypes must be array");
        var arr = v.AsArray();
        var result = new string[arr.Length];
        for (int i = 0; i < arr.Length; i++)
        {
            var item = arr.Get((ulong)i);
            if (!item.IsString())
                throw new JavaScriptException(engine.Intrinsics.Error, "argTypes must be strings");
            result[i] = item.AsString();
        }
        return result;
    }

    private static object[] ToObjectArray(Engine engine, JsValue v)
    {
        if (!v.IsArray())
            throw new JavaScriptException(engine.Intrinsics.Error, "args must be array");
        var arr = v.AsArray();
        var result = new object[arr.Length];
        for (int i = 0; i < arr.Length; i++)
            result[i] = arr.Get((ulong)i).ToObject();
        return result;
    }

    // 按 argTypes 把 JS 传来的值转成委托签名期望的 CLR 类型
    private static object[] CoerceArgs(object[] args, string[] argTypes)
    {
        if (args.Length != argTypes.Length)
            throw new InvalidOperationException($"args count {args.Length} != types count {argTypes.Length}");
        var result = new object[args.Length];
        for (int i = 0; i < args.Length; i++)
            result[i] = CoerceArg(args[i], argTypes[i]);
        return result;
    }

    private static object CoerceArg(object v, string type)
    {
        return type switch
        {
            "int" => Convert.ToInt32(v),
            "uint" => Convert.ToUInt32(v),
            "long" => Convert.ToInt64(v),
            "ulong" => Convert.ToUInt64(v),
            "float" => Convert.ToSingle(v),
            "double" => Convert.ToDouble(v),
            "bool" => Convert.ToBoolean(v),
            "intptr" or "ptr" => v is NativeHandle h ? h.Value : new IntPtr(Convert.ToInt64(v)),
            "string" or "wstring" => v?.ToString() ?? "",
            _ => v
        };
    }

    private static object? InvokeNative(IntPtr ptr, string[] argTypes, object[] args, string retType)
    {
        var key = retType + "|" + string.Join(",", argTypes);
        if (!_delegateCache.TryGetValue(key, out var delType))
        {
            delType = BuildDelegateType(retType, argTypes);
            _delegateCache[key] = delType;
        }
        var del = Marshal.GetDelegateForFunctionPointer(ptr, delType);
        var result = del.DynamicInvoke(args);
        if (delType.GetMethod("Invoke")!.ReturnType == typeof(IntPtr) && result is IntPtr ip)
            return new NativeHandle(ip);
        return result;
    }

    // 动态构造非泛型委托类型，带 UnmanagedFunctionPointer 和参数 MarshalAs
    private static Type BuildDelegateType(string retType, string[] argTypes)
    {
        var retClr = MapReturnType(retType);
        var specs = argTypes.Select(MapParamType).ToArray();

        var an = new AssemblyName("NativeDynDelegate");
        var ab = AssemblyBuilder.DefineDynamicAssembly(an, AssemblyBuilderAccess.Run);
        var mb = ab.DefineDynamicModule("m");
        var tb = mb.DefineType("NDel_" + Guid.NewGuid().ToString("N"),
            TypeAttributes.Sealed | TypeAttributes.Public, typeof(MulticastDelegate));

        // Windows API 用 StdCall，其它平台用 Cdecl
        var cc = OperatingSystem.IsWindows() ? CallingConvention.StdCall : CallingConvention.Cdecl;
        var unmgCtor = typeof(UnmanagedFunctionPointerAttribute)
            .GetConstructor(new[] { typeof(CallingConvention) })!;
        tb.SetCustomAttribute(new CustomAttributeBuilder(unmgCtor, new object[] { cc }));

        // MulticastDelegate 必需的构造函数签名
        var ctor = tb.DefineConstructor(
            MethodAttributes.RTSpecialName | MethodAttributes.HideBySig | MethodAttributes.Public,
            CallingConventions.Standard, new[] { typeof(object), typeof(IntPtr) });
        ctor.SetImplementationFlags(MethodImplAttributes.Runtime | MethodImplAttributes.Managed);

        var paramTypes = specs.Select(s => s.Type).ToArray();
        var invoke = tb.DefineMethod("Invoke",
            MethodAttributes.Public | MethodAttributes.HideBySig |
            MethodAttributes.NewSlot | MethodAttributes.Virtual,
            retClr, paramTypes);
        for (int i = 0; i < specs.Length; i++)
        {
            var pb = invoke.DefineParameter(i + 1, ParameterAttributes.None, "p" + i);
            if (specs[i].Marshal.HasValue)
            {
                var maCtor = typeof(MarshalAsAttribute)
                    .GetConstructor(new[] { typeof(UnmanagedType) })!;
                pb.SetCustomAttribute(new CustomAttributeBuilder(maCtor,
                    new object[] { specs[i].Marshal!.Value }));
            }
        }
        invoke.SetImplementationFlags(MethodImplAttributes.Runtime | MethodImplAttributes.Managed);

        return tb.CreateType()!;
    }

    private static Type MapReturnType(string t) => t switch
    {
        "void" => typeof(void),
        "int" => typeof(int),
        "uint" => typeof(uint),
        "long" => typeof(long),
        "ulong" => typeof(ulong),
        "intptr" or "ptr" => typeof(IntPtr),
        "float" => typeof(float),
        "double" => typeof(double),
        "bool" => typeof(bool),
        _ => throw new InvalidOperationException($"unsupported return type: {t}")
    };

    private static (Type Type, UnmanagedType? Marshal) MapParamType(string t) => t switch
    {
        "int" => (typeof(int), null),
        "uint" => (typeof(uint), null),
        "long" => (typeof(long), null),
        "ulong" => (typeof(ulong), null),
        "intptr" or "ptr" => (typeof(IntPtr), null),
        "string" => (typeof(string), UnmanagedType.LPStr),
        "wstring" => (typeof(string), UnmanagedType.LPWStr),
        "float" => (typeof(float), null),
        "double" => (typeof(double), null),
        "bool" => (typeof(bool), null),
        _ => throw new InvalidOperationException($"unsupported param type: {t}")
    };
}
