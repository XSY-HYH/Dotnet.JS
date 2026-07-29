using System.IO;
using Jint;
using Jint.Native;
using Jint.Runtime;

namespace Dotnet.JS.Repl;

// 脚本执行：无参自动跑 Dotnet.JS.Main.js，有参跑脚本，有 main 优先调用 main(args)
internal class ScriptRunner
{
    private readonly Engine _engine;
    private readonly string _exeDir;

    public ScriptRunner(Engine engine)
    {
        _engine = engine;
        // 单文件发布下 GetEntryAssembly().Location 返回空串，用 AppContext.BaseDirectory
        _exeDir = AppContext.BaseDirectory;
    }

    // 无参时跑 Dotnet.JS.Main.js，返回是否找到并执行
    public bool RunMain()
    {
        var mainJsPath = Path.Combine(_exeDir, "Dotnet.JS.Main.js");
        if (!File.Exists(mainJsPath)) return false;

        try
        {
            var code = File.ReadAllText(mainJsPath);
            _engine.Execute(code);
            return InvokeMain(Array.Empty<JsValue>());
        }
        catch (Exception ex)
        {
            PrintError(ex);
            Environment.ExitCode = 1;
            return true;
        }
    }

    public int RunScript(string scriptPath, string[] scriptArgs)
    {
        var fullPath = Path.GetFullPath(scriptPath);
        if (!File.Exists(fullPath))
        {
            Console.Error.WriteLine($"ERROR: File not found: {fullPath}");
            return 1;
        }

        try
        {
            var code = File.ReadAllText(fullPath);
            // 主脚本也注入 __filename/__dirname 让 require 相对路径能工作
            _engine.SetValue("__filename", fullPath);
            _engine.SetValue("__dirname", Path.GetDirectoryName(fullPath));
            // 设置 __argv 给 process.argv getter 读取
            var argvList = new List<string> { "Dotnet.JS", fullPath };
            argvList.AddRange(scriptArgs);
            _engine.SetValue("__argv", JsValue.FromObject(_engine, argvList.ToArray()));
            _engine.Execute(code);

            var argsObject = JsValue.FromObject(_engine, scriptArgs);
            InvokeMain(new[] { argsObject });
            return Environment.ExitCode;
        }
        catch (Exception ex)
        {
            PrintError(ex);
            return 1;
        }
    }

    private bool InvokeMain(JsValue[] args)
    {
        var mainCheck = _engine.Evaluate("typeof main === 'function'");
        if (mainCheck.Type != Types.Boolean || !mainCheck.AsBoolean())
        {
            // 无 main 函数，脚本顶层已执行
            return true;
        }

        var result = _engine.Invoke("main", args);
        if (result != null && result.IsNumber())
        {
            var exitCode = (int)result.AsNumber();
            Environment.ExitCode = exitCode;
            if (exitCode != 0)
                Console.Error.WriteLine($"ERROR: Script returned non-zero exit code: {exitCode}");
        }
        return true;
    }

    private static void PrintError(Exception ex)
    {
        Console.Error.WriteLine($"ERROR: {ex.Message}");
        if (ex.StackTrace != null)
            Console.Error.WriteLine(ex.StackTrace);
    }
}
