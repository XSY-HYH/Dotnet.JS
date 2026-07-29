using System.IO;
using Jint;
using Jint.Native;
using Jint.Native.Object;
using Jint.Runtime;

namespace Dotnet.JS.Modules;

// require 实现，用 IIFE 包装模块代码隔离作用域
// 修复旧 JintRepl 嵌套 require 时全局 module/exports 被覆盖的 bug
internal class ModuleResolver
{
    private readonly Engine _engine;
    private readonly LibraryPathManager _paths;
    private readonly Dictionary<string, JsValue> _cache = new();

    public ModuleResolver(Engine engine, LibraryPathManager paths)
    {
        _engine = engine;
        _paths = paths;
    }

    public JsValue Require(string filePath)
    {
        var fullPath = ResolveModule(filePath);
        if (fullPath == null)
            throw new JavaScriptException(_engine.Intrinsics.Error, $"Module not found: {filePath}");

        if (_cache.TryGetValue(fullPath, out var cached))
            return cached;

        var code = File.ReadAllText(fullPath);

        var moduleObj = new JsObject(_engine);
        var exportsObj = new JsObject(_engine);
        moduleObj.Set("exports", exportsObj);

        // 保存外层全局，避免嵌套 require 污染外层模块
        var outerModule = _engine.GetValue("module");
        var outerExports = _engine.GetValue("exports");
        var outerFilename = _engine.GetValue("__filename");
        var outerDirname = _engine.GetValue("__dirname");

        try
        {
            _engine.SetValue("module", moduleObj);
            _engine.SetValue("exports", exportsObj);
            _engine.SetValue("__filename", fullPath);
            _engine.SetValue("__dirname", Path.GetDirectoryName(fullPath));

            // IIFE 包装让模块顶层 var 不泄漏到全局
            _engine.Execute(BuildIife(code));
        }
        finally
        {
            _engine.SetValue("module", outerModule);
            _engine.SetValue("exports", outerExports);
            _engine.SetValue("__filename", outerFilename);
            _engine.SetValue("__dirname", outerDirname);
        }

        var result = moduleObj.Get("exports");
        _cache[fullPath] = result;
        return result;
    }

    private static string BuildIife(string code)
    {
        return "(function(module, exports, __filename, __dirname, require) {\n"
             + code
             + "\n})(module, exports, __filename, __dirname, require)";
    }

    public string? ResolveModule(string filePath)
    {
        // 相对路径优先相对当前模块的 __dirname（Node.js 风格）
        if ((filePath.StartsWith("./") || filePath.StartsWith("../"))
            && _engine.GetValue("__dirname") is { } dirname && dirname.IsString())
        {
            var baseDir = dirname.AsString();
            foreach (var ext in new[] { "", ".js", ".json" })
            {
                var candidate = Path.GetFullPath(Path.Combine(baseDir, filePath + ext));
                if (File.Exists(candidate)) return candidate;
            }
        }

        if (File.Exists(filePath)) return Path.GetFullPath(filePath);

        var extensions = new[] { "", ".js", ".json" };
        foreach (var basePath in _paths.GetPaths())
        {
            foreach (var ext in extensions)
            {
                var candidate = Path.Combine(basePath, filePath + ext);
                if (File.Exists(candidate)) return Path.GetFullPath(candidate);

                foreach (var subDir in new[] { "std", "modules", "lib" })
                {
                    var subCandidate = Path.Combine(basePath, subDir, filePath + ext);
                    if (File.Exists(subCandidate)) return Path.GetFullPath(subCandidate);
                }
            }
        }
        return null;
    }

    public void Register()
    {
        _engine.SetValue("require", new Func<string, JsValue>(Require));
    }
}
