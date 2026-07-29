using System.Reflection;
using Jint;
using Jint.Native;
using Jint.Native.Object;
using Jint.Runtime;
using Jint.Runtime.Interop;

namespace Dotnet.JS.Runtime;

// 类型包装器，把 CLR Type 包成 JS 对象
// 消除旧 JintRepl 里 __load_assembly 和 __load_assembly_from 的重复代码
internal static class TypeWrapper
{
    public static JsObject Create(Engine engine, Type type)
    {
        var wrapper = new JsObject(engine);
        wrapper.Set("name", type.FullName ?? type.Name);

        wrapper.Set("createInstance", new ClrFunction(engine, "createInstance",
            (thisObj, args) =>
            {
                var ctors = type.GetConstructors(BindingFlags.Public | BindingFlags.Instance);
                if (ctors.Length == 0)
                    throw CreateException(engine, $"no public constructor for {type.Name}");
                var expanded = MethodBinder.MaybeExpandArray(args, ctors.Cast<MethodBase>().ToArray());
                var ctor = MethodBinder.SelectCtor(ctors, expanded);
                if (ctor == null)
                    throw CreateException(engine, $"no matching constructor for {type.Name} with ({MethodBinder.DescribeArgs(expanded)})");
                var clrArgs = MethodBinder.CoerceArgs(ctor, expanded);
                var instance = ctor.Invoke(clrArgs);
                return JsValueConverter.ToJsValue(engine, instance);
            }));

        wrapper.Set("callStatic", new ClrFunction(engine, "callStatic",
            (thisObj, args) =>
            {
                if (args.Length == 0 || !args[0].IsString())
                    throw CreateException(engine, "callStatic needs method name");
                var methodName = args[0].AsString();
                var rest = args.Skip(1).ToArray();
                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Static)
                                  .Where(m => m.Name == methodName)
                                  .ToArray();
                if (methods.Length == 0)
                    throw CreateException(engine, $"method not found: {type.Name}.{methodName}");
                rest = MethodBinder.MaybeExpandArray(rest, methods.Cast<MethodBase>().ToArray());
                var method = MethodBinder.SelectBest(methods, rest);
                if (method == null)
                    throw CreateException(engine, $"no overload of {type.Name}.{methodName} matches ({MethodBinder.DescribeArgs(rest)})");
                var clrArgs = MethodBinder.CoerceArgs(method, rest);
                var result = method.Invoke(null, clrArgs);
                return JsValueConverter.ToJsValue(engine, result);
            }));

        wrapper.Set("getProperty", new ClrFunction(engine, "getProperty",
            (thisObj, args) =>
            {
                if (args.Length == 0 || !args[0].IsString())
                    throw CreateException(engine, "getProperty needs property name");
                var name = args[0].AsString();
                var prop = type.GetProperty(name, BindingFlags.Public | BindingFlags.Static);
                if (prop != null)
                    return JsValueConverter.ToJsValue(engine, prop.GetValue(null));
                var field = type.GetField(name, BindingFlags.Public | BindingFlags.Static);
                if (field != null)
                    return JsValueConverter.ToJsValue(engine, field.GetValue(null));
                throw CreateException(engine, $"property not found: {type.Name}.{name}");
            }));

        wrapper.Set("setProperty", new ClrFunction(engine, "setProperty",
            (thisObj, args) =>
            {
                if (args.Length < 2 || !args[0].IsString())
                    throw CreateException(engine, "setProperty needs property name and value");
                var name = args[0].AsString();
                var prop = type.GetProperty(name, BindingFlags.Public | BindingFlags.Static);
                if (prop != null)
                {
                    prop.SetValue(null, JsValueConverter.ToClrValue(args[1], prop.PropertyType));
                    return JsValue.Undefined;
                }
                var field = type.GetField(name, BindingFlags.Public | BindingFlags.Static);
                if (field != null)
                {
                    field.SetValue(null, JsValueConverter.ToClrValue(args[1], field.FieldType));
                    return JsValue.Undefined;
                }
                throw CreateException(engine, $"property not found: {type.Name}.{name}");
            }));

        wrapper.Set("callInstance", new ClrFunction(engine, "callInstance",
            (thisObj, args) =>
            {
                if (args.Length < 2 || !args[1].IsString())
                    throw CreateException(engine, "callInstance needs instance and method name");
                var instance = args[0].ToObject();
                var methodName = args[1].AsString();
                var rest = args.Skip(2).ToArray();
                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                                  .Where(m => m.Name == methodName)
                                  .ToArray();
                if (methods.Length == 0)
                    throw CreateException(engine, $"method not found: {type.Name}.{methodName}");
                rest = MethodBinder.MaybeExpandArray(rest, methods.Cast<MethodBase>().ToArray());
                var method = MethodBinder.SelectBest(methods, rest);
                if (method == null)
                    throw CreateException(engine, $"no overload of {type.Name}.{methodName} matches ({MethodBinder.DescribeArgs(rest)})");
                var clrArgs = MethodBinder.CoerceArgs(method, rest);
                var result = method.Invoke(instance, clrArgs);
                return JsValueConverter.ToJsValue(engine, result);
            }));

        wrapper.Set("getInstanceProperty", new ClrFunction(engine, "getInstanceProperty",
            (thisObj, args) =>
            {
                if (args.Length < 2 || !args[1].IsString())
                    throw CreateException(engine, "getInstanceProperty needs instance and property name");
                var instance = args[0].ToObject();
                var name = args[1].AsString();
                var prop = type.GetProperty(name, BindingFlags.Public | BindingFlags.Instance);
                if (prop != null)
                    return JsValueConverter.ToJsValue(engine, prop.GetValue(instance));
                var field = type.GetField(name, BindingFlags.Public | BindingFlags.Instance);
                if (field != null)
                    return JsValueConverter.ToJsValue(engine, field.GetValue(instance));
                throw CreateException(engine, $"property not found: {type.Name}.{name}");
            }));

        wrapper.Set("setInstanceProperty", new ClrFunction(engine, "setInstanceProperty",
            (thisObj, args) =>
            {
                if (args.Length < 3 || !args[1].IsString())
                    throw CreateException(engine, "setInstanceProperty needs instance, property name and value");
                var instance = args[0].ToObject();
                var name = args[1].AsString();
                var prop = type.GetProperty(name, BindingFlags.Public | BindingFlags.Instance);
                if (prop != null)
                {
                    prop.SetValue(instance, JsValueConverter.ToClrValue(args[2], prop.PropertyType));
                    return JsValue.Undefined;
                }
                var field = type.GetField(name, BindingFlags.Public | BindingFlags.Instance);
                if (field != null)
                {
                    field.SetValue(instance, JsValueConverter.ToClrValue(args[2], field.FieldType));
                    return JsValue.Undefined;
                }
                throw CreateException(engine, $"property not found: {type.Name}.{name}");
            }));

        return wrapper;
    }

    // 抛 JS 异常而不是返回 null，让调用方知道到底哪里错了
    private static JavaScriptException CreateException(Engine engine, string message)
    {
        return new JavaScriptException(engine.Intrinsics.Error, message);
    }
}
