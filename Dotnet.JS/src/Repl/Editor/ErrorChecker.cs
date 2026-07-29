using Esprima;

namespace Dotnet.JS.Repl.Editor;

// JS 语法错误检测，用 Esprima parser 实时解析
// 支持多行累积：检测 fullCode，错误位置映射到当前行（lineStart 之后）
internal static class ErrorChecker
{
    public static (int Index, string Message)? CheckSyntax(string fullCode, int lineStart)
    {
        if (string.IsNullOrWhiteSpace(fullCode)) return null;
        try
        {
            var parser = new JavaScriptParser();
            parser.ParseScript(fullCode);
            return null;
        }
        catch (ParserException ex)
        {
            // Position 只有 Line/Column，转成字符 index
            int line = ex.Error.Position.Line;
            int col = ex.Error.Position.Column;
            int idx = 0;
            int l = 1;
            while (idx < fullCode.Length && l < line)
            {
                if (fullCode[idx] == '\n') l++;
                idx++;
            }
            idx += col;
            // 错误在历史行（lineStart 之前），不标记当前行
            if (idx < lineStart) return null;
            int currentIdx = idx - lineStart;
            int currentLen = fullCode.Length - lineStart;
            if (currentIdx >= currentLen) currentIdx = currentLen - 1;
            if (currentIdx < 0) currentIdx = 0;
            return (currentIdx, ex.Error.Description);
        }
    }
}
