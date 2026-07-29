using Jint;
using Jint.Native;
using Jint.Runtime;

namespace Dotnet.TS;

// TS REPL 主循环，输入 TS 编译成 JS 执行，带多行/历史/高亮/补全
internal class TsReplLoop
{
    private readonly Engine _engine;
    private readonly TsLineEditor _editor;

    public TsReplLoop(Engine engine)
    {
        _engine = engine;
        _editor = new TsLineEditor(engine);
    }

    public void Run()
    {
        Console.TreatControlCAsInput = true;
        while (true)
        {
            var input = _editor.ReadLine("ts> ");
            if (input == null) break;
            if (string.IsNullOrWhiteSpace(input)) continue;
            try
            {
                Console.TreatControlCAsInput = false;
                var js = Transpile(input);
                var result = _engine.Evaluate(js);
                if (result != null
                    && result.Type != Types.Null
                    && result.Type != Types.Undefined)
                    Console.WriteLine(result);
            }
            catch (Exception ex) { PrintError(ex); }
            finally { Console.TreatControlCAsInput = true; }
        }
    }

    // TS 编译成 JS，调 ts.transpileModule
    private string Transpile(string code)
    {
        _engine.SetValue("__ts_repl_input", code);
        var result = _engine.Evaluate("ts.transpileModule(__ts_repl_input,{compilerOptions:{target:7,module:0}}).outputText");
        return result.IsString() ? result.AsString() : "";
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
