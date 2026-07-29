using System.IO;
using System.Reflection;
using Jint;
using Jint.Native;
using Jint.Runtime;
using Jint.Runtime.Interop;

namespace Dotnet.TS;

// Dotnet.TS 扩展入口，约定类名 Extension + Initialize(Engine)
// 注册 tsrepl() 接管控制台进入 TS REPL，tsCompile(code) 单次编译
public class Extension
{
    private static bool _tsLoaded;
    private static string _dllDir = "";

    public void Initialize(Engine engine)
    {
        _dllDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location) ?? "";

        engine.SetValue("__ts_repl", new ClrFunction(engine, "__ts_repl", (_, _) =>
        {
            EnsureTsLoaded(engine);
            new TsReplLoop(engine).Run();
            return JsValue.Undefined;
        }));

        engine.SetValue("__ts_compile", new ClrFunction(engine, "__ts_compile", (_, a) =>
        {
            EnsureTsLoaded(engine);
            var code = a.Length > 0 && a[0].IsString() ? a[0].AsString() : "";
            return Transpile(engine, code);
        }));

        engine.Execute("globalThis.tsrepl = __ts_repl; globalThis.tsCompile = __ts_compile;");
    }

    // 懒加载 typescript.js，首次编译或进 REPL 时注入 ts 全局
    private static void EnsureTsLoaded(Engine engine)
    {
        if (_tsLoaded) return;
        var tsPath = Path.Combine(_dllDir, "typescript.js");
        if (!File.Exists(tsPath))
            throw new JavaScriptException(engine.Intrinsics.Error, $"typescript.js not found: {tsPath}");
        var tsSource = File.ReadAllText(tsPath);
        engine.Execute(tsSource);
        _tsLoaded = true;
    }

    // 调 ts.transpileModule 编译 TS 字符串为 JS，target ES2020 module None
    private static string Transpile(Engine engine, string code)
    {
        engine.SetValue("__ts_input", code);
        var result = engine.Evaluate("ts.transpileModule(__ts_input,{compilerOptions:{target:7,module:0}}).outputText");
        return result.IsString() ? result.AsString() : "";
    }
}
