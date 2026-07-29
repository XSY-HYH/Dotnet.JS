using Jint;
using Jint.Native;

namespace Dotnet.TS;

// TS 语法检查，调 ts.transpileModule reportDiagnostics 取首个诊断
internal static class TsErrorChecker
{
    public static (int Index, string Message)? CheckSyntax(Engine engine, string fullCode, int lineStart)
    {
        if (string.IsNullOrWhiteSpace(fullCode)) return null;
        try
        {
            engine.SetValue("__ts_err_input", fullCode);
            var result = engine.Evaluate("ts.transpileModule(__ts_err_input,{compilerOptions:{target:7,module:0},reportDiagnostics:true}).diagnostics");
            if (result.IsArray())
            {
                var arr = result.AsArray();
                if (arr.Length > 0)
                {
                    var diag = arr.Get(0);
                    var mt = diag.Get("messageText");
                    string msg = mt.IsString() ? mt.AsString() : "syntax error";
                    int start = 0;
                    var sv = diag.Get("start");
                    if (sv.IsNumber()) start = (int)sv.AsNumber();
                    if (start < lineStart) return null;
                    int cur = start - lineStart;
                    int len = fullCode.Length - lineStart;
                    if (cur >= len) cur = len - 1;
                    if (cur < 0) cur = 0;
                    return (cur, msg);
                }
            }
            return null;
        }
        catch
        {
            return null;
        }
    }
}
