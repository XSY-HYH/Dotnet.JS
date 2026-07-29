using Jint;
using Jint.Native;
using Jint.Runtime;
using Dotnet.JS.Repl.Editor;

namespace Dotnet.JS.Repl;

// REPL 主循环，带多行输入支持
internal class ReplLoop
{
    private readonly Engine _engine;
    private readonly LineEditor _editor;

    public ReplLoop(Engine engine)
    {
        _engine = engine;
        _editor = new LineEditor(engine);
    }

    public void Run()
    {
        // Ctrl+C 作为输入，不退出
        Console.TreatControlCAsInput = true;

        while (true)
        {
            var input = _editor.ReadLine("> ");
            if (input == null) break;

            if (string.IsNullOrWhiteSpace(input))
                continue;

            try
            {
                // 执行期间放开 Ctrl+C，让它触发 CancelKeyPress 传给 JS
                // 比如 require 一个 app.run 的脚本，Ctrl+C 才能被 ASP.NET Core 收到优雅关闭
                Console.TreatControlCAsInput = false;
                var result = _engine.Evaluate(input);
                if (result != null
                    && result.Type != Types.Null
                    && result.Type != Types.Undefined)
                    Console.WriteLine(result);
            }
            catch (Exception ex)
            {
                PrintError(ex);
            }
            finally
            {
                // 恢复给 LineEditor，输入时 Ctrl+C 清空行不退出
                Console.TreatControlCAsInput = true;
            }
        }
    }

    private static void PrintError(Exception ex)
    {
        var oldColor = Console.ForegroundColor;
        try
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Error.WriteLine($"ERROR: {ex.Message}");
        }
        finally { Console.ForegroundColor = oldColor; }
    }
}
