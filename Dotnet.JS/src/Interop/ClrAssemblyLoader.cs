using System.Reflection;
using System.Runtime.InteropServices;
using Jint;
using Jint.Native;
using Jint.Native.Array;
using Jint.Native.Object;
using Jint.Runtime;
using Jint.Runtime.Interop;
using Dotnet.JS.Runtime;

namespace Dotnet.JS.Interop;

// 程序集加载器，合并旧 JintRepl 里 __load_assembly 和 __load_assembly_from 的重复逻辑
internal static class ClrAssemblyLoader
{
    private static bool _allSystemLoaded = false;

    public static Assembly LoadByName(string name)
    {
        foreach (var a in AppDomain.CurrentDomain.GetAssemblies())
        {
            if (a.GetName().Name == name || a.FullName == name) return a;
        }
        try { return Assembly.Load(name); }
        catch { /* 运行时上下文失败，尝试 lib/ncl 兜底 */ }
        var nclPath = Path.Combine(AppContext.BaseDirectory, "lib", "ncl", name + ".dll");
        if (File.Exists(nclPath)) return Assembly.LoadFrom(nclPath);
        throw new FileNotFoundException($"assembly not found in context or lib/ncl: {name}");
    }

    public static Assembly LoadFromPath(string path)
    {
        return Assembly.LoadFrom(Path.GetFullPath(path));
    }

    // 在已加载程序集里查找类型
    private static Type? FindInLoaded(string typeName)
    {
        foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
        {
            try
            {
                var t = asm.GetType(typeName);
                if (t != null) return t;
            }
            catch { /* 某些程序集 GetType 会抛，跳过 */ }
        }
        return null;
    }

    // 运行时目录 + lib/ncl 下 System.*.dll 全量加载，兜底找 type forward 跨程序集的类型
    private static void EnsureAllSystemAssembliesLoaded()
    {
        if (_allSystemLoaded) return;
        _allSystemLoaded = true;
        LoadSystemDlls(RuntimeEnvironment.GetRuntimeDirectory());
        LoadSystemDlls(Path.Combine(AppContext.BaseDirectory, "lib", "ncl"));
    }

    // 加载目录下 System.*.dll，单文件发布 Assembly.Load(name) 可能失败，用 LoadFrom 具体路径
    private static void LoadSystemDlls(string dir)
    {
        if (!Directory.Exists(dir)) return;
        foreach (var dll in Directory.EnumerateFiles(dir, "*.dll"))
        {
            var name = Path.GetFileNameWithoutExtension(dll);
            if (!name.StartsWith("System.")) continue;
            try { Assembly.LoadFrom(dll); }
            catch { /* 某些 dll 不可加载，跳过 */ }
        }
    }

    // 把程序集包装成 JS 对象，getType 返回 TypeWrapper
    public static JsObject Wrap(Engine engine, Assembly asm)
    {
        var wrapper = new JsObject(engine);
        wrapper.Set("name", asm.GetName().Name ?? "");

        wrapper.Set("getType", new ClrFunction(engine, "getType",
            (thisObj, args) =>
            {
                if (args.Length == 0 || !args[0].IsString())
                    throw new JavaScriptException(engine.Intrinsics.Error, "getType needs type name");
                var typeName = args[0].AsString();
                var type = asm.GetType(typeName);
                if (type == null)
                    throw new JavaScriptException(engine.Intrinsics.Error,
                        $"type not found in {asm.GetName().Name}: {typeName}");
                return TypeWrapper.Create(engine, type);
            }));

        wrapper.Set("getTypes", new ClrFunction(engine, "getTypes",
            (thisObj, args) =>
            {
                var jsArr = new JsArray(engine);
                foreach (var t in asm.GetTypes())
                    jsArr.Push((JsValue)(t.FullName ?? t.Name));
                return jsArr;
            }));

        return wrapper;
    }

    public static void Register(Engine engine)
    {
        engine.SetValue("__load_assembly", new Func<string, JsObject>(name =>
        {
            try
            {
                var asm = LoadByName(name);
                return Wrap(engine, asm);
            }
            catch (Exception ex)
            {
                throw new JavaScriptException(engine.Intrinsics.Error,
                    $"load_assembly failed for '{name}': {ex.Message}");
            }
        }));

        engine.SetValue("__load_assembly_from", new Func<string, JsObject>(path =>
        {
            try
            {
                var asm = LoadFromPath(path);
                return Wrap(engine, asm);
            }
            catch (Exception ex)
            {
                throw new JavaScriptException(engine.Intrinsics.Error,
                    $"load_assembly_from failed for '{path}': {ex.Message}");
            }
        }));

        // 按类型名查找，找不到时全量加载 System.*.dll 后重试
        engine.SetValue("__find_type", new Func<string, JsObject>(typeName =>
        {
            var found = FindInLoaded(typeName);
            if (found == null)
            {
                EnsureAllSystemAssembliesLoaded();
                found = FindInLoaded(typeName);
            }
            if (found == null)
                throw new JavaScriptException(engine.Intrinsics.Error,
                    $"type not found: {typeName}");
            return TypeWrapper.Create(engine, found);
        }));
    }
}
