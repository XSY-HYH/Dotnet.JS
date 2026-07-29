using System.IO;
using System.Reflection;
using Jint;
using Jint.Native;
using Jint.Native.Object;
using Jint.Runtime;
using Dotnet.JS.Interop;

namespace Dotnet.JS.Extensions;

// 扩展库加载，约定 dll 有公开类 Extension 带无参构造和 Initialize(Engine) 方法
internal static class ExtensionLoader
{
    public static JsObject Load(Engine engine, string dllPath)
    {
        var fullPath = Path.GetFullPath(dllPath);
        if (!File.Exists(fullPath))
            throw new JavaScriptException(engine.Intrinsics.Error, $"extension not found: {fullPath}");

        var asm = Assembly.LoadFrom(fullPath);

        var extType = asm.GetTypes().FirstOrDefault(t => t.IsClass && t.IsPublic && t.Name == "Extension");
        if (extType == null)
            throw new JavaScriptException(engine.Intrinsics.Error,
                $"Extension class not found in {Path.GetFileName(fullPath)}");

        var initMethod = extType.GetMethod("Initialize", new[] { typeof(Engine) });
        if (initMethod == null)
            throw new JavaScriptException(engine.Intrinsics.Error,
                $"Extension.Initialize(Engine) not found in {extType.FullName}");

        var instance = Activator.CreateInstance(extType);
        initMethod.Invoke(instance, new object[] { engine });

        return ClrAssemblyLoader.Wrap(engine, asm);
    }
}
