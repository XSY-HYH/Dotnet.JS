namespace Dotnet.JS.Repl;

// 大括号/小括号/中括号平衡检测
// 处理字符串、模板字符串、单行/多行注释
internal static class BraceMatcher
{
    public static bool IsBalanced(string code)
    {
        int brace = 0, paren = 0, bracket = 0;
        int i = 0;
        while (i < code.Length)
        {
            char c = code[i];

            // 单行注释
            if (c == '/' && i + 1 < code.Length && code[i + 1] == '/')
            {
                while (i < code.Length && code[i] != '\n') i++;
                continue;
            }
            // 多行注释
            if (c == '/' && i + 1 < code.Length && code[i + 1] == '*')
            {
                i += 2;
                while (i + 1 < code.Length && !(code[i] == '*' && code[i + 1] == '/')) i++;
                i += 2;
                continue;
            }
            // 字符串
            if (c == '"' || c == '\'')
            {
                i = SkipString(code, i, c);
                continue;
            }
            // 模板字符串
            if (c == '`')
            {
                i = SkipTemplate(code, i);
                continue;
            }

            if (c == '{') brace++;
            else if (c == '}') brace--;
            else if (c == '(') paren++;
            else if (c == ')') paren--;
            else if (c == '[') bracket++;
            else if (c == ']') bracket--;

            i++;
        }
        return brace == 0 && paren == 0 && bracket == 0;
    }

    private static int SkipString(string code, int start, char quote)
    {
        int i = start + 1;
        while (i < code.Length)
        {
            if (code[i] == '\\' && i + 1 < code.Length) { i += 2; continue; }
            if (code[i] == quote) return i + 1;
            if (code[i] == '\n') return i;
            i++;
        }
        return i;
    }

    // 模板字符串里 ${} 内只数 brace 找匹配
    private static int SkipTemplate(string code, int start)
    {
        int i = start + 1;
        while (i < code.Length)
        {
            if (code[i] == '\\' && i + 1 < code.Length) { i += 2; continue; }
            if (code[i] == '`') return i + 1;
            if (code[i] == '$' && i + 1 < code.Length && code[i + 1] == '{')
            {
                i += 2;
                int depth = 1;
                while (i < code.Length && depth > 0)
                {
                    if (code[i] == '{') depth++;
                    else if (code[i] == '}') depth--;
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
    }
}
