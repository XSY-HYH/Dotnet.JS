using Jint;
using Jint.Native;
using Jint.Native.Object;
using System.Collections.Generic;

namespace Dotnet.JS.Repl.Editor;

// JS 行内语法高亮，ANSI 真彩色，配色参考 VSCode Dark+
// token 分类参考 TypeScript.tmTheme 的 vsclassificationtype
// 关键字/数字格式参考 TypeScript.YAML-tmLanguage 的 variables
internal static class JsHighlighter
{
    internal static readonly HashSet<string> Keywords = new()
    {
        "var", "let", "const", "function", "return", "if", "else", "for", "while",
        "do", "switch", "case", "break", "continue", "new", "delete", "typeof",
        "instanceof", "in", "of", "this", "true", "false", "null", "undefined",
        "require", "module", "exports", "throw", "try", "catch", "finally", "class",
        "extends", "super", "yield", "await", "async", "void",
        "import", "export", "default", "with", "debugger", "implements", "enum",
        "interface", "type", "namespace", "as", "from", "get", "set", "static",
        "public", "private", "protected", "readonly", "abstract", "declare",
        "keyof", "infer", "is", "using"
    };

    // 注释 #6A9955 字符串 #CE9178 关键字 #569CD6 数字 #B5CEA8
    // 函数名 #DCDCAA 未定义 #F44747 类型名 #4EC9B0 常量 #4FC1FF 操作符 #D4D4D4
    // 默认文本淡青色 #A0DCDC
    private const int DefaultR = 232;
    private const int DefaultG = 200;
    private const int DefaultB = 106;

    static void Color(int r, int g, int b, string text)
    {
        Console.Write($"\x1b[38;2;{r};{g};{b}m");
        Console.Write(text);
        Console.Write("\x1b[39m");
    }

    // 输出默认颜色（淡青色）的文本
    static void WriteDefault(string text)
    {
        Console.Write($"\x1b[38;2;{DefaultR};{DefaultG};{DefaultB}m");
        Console.Write(text);
        Console.Write("\x1b[39m");
    }

    // 亮红色显示 ^C
    public static void WriteCtrlC(string text)
    {
        Color(255, 51, 51, text);
    }

    public static void WriteHighlighted(string text, Engine? engine = null)
    {
        int i = 0;
        while (i < text.Length)
        {
            // 行注释 //
            if (i + 1 < text.Length && text[i] == '/' && text[i + 1] == '/')
            {
                Color(106, 153, 85, text.Substring(i));
                return;
            }
            // 块注释 /* */
            if (i + 1 < text.Length && text[i] == '/' && text[i + 1] == '*')
            {
                int end = text.IndexOf("*/", i + 2);
                if (end < 0) end = text.Length;
                else end += 2;
                Color(106, 153, 85, text.Substring(i, end - i));
                i = end;
                continue;
            }
            // 字符串
            if (text[i] == '"' || text[i] == '\'')
            {
                var quote = text[i];
                int start = i;
                i++;
                while (i < text.Length && text[i] != quote)
                {
                    if (text[i] == '\\' && i + 1 < text.Length) i += 2;
                    else i++;
                }
                if (i < text.Length) i++;
                Color(206, 145, 120, text.Substring(start, i - start));
                continue;
            }
            // 模板字符串 `...`
            if (text[i] == '`')
            {
                int start = i;
                i++;
                while (i < text.Length && text[i] != '`')
                {
                    if (text[i] == '\\' && i + 1 < text.Length) i += 2;
                    else i++;
                }
                if (i < text.Length) i++;
                Color(206, 145, 120, text.Substring(start, i - start));
                continue;
            }
            // 标识符或关键字
            if (char.IsLetter(text[i]) || text[i] == '_' || text[i] == '$')
            {
                int start = i;
                while (i < text.Length && (char.IsLetterOrDigit(text[i]) || text[i] == '_' || text[i] == '$')) i++;
                var word = text.Substring(start, i - start);

                if (Keywords.Contains(word))
                {
                    Color(86, 156, 214, word);
                    continue;
                }
                // 前一个非空白是否 .（链中段由链头处理）
                int prevNonWs = start - 1;
                while (prevNonWs >= 0 && char.IsWhiteSpace(text[prevNonWs])) prevNonWs--;
                bool isProperty = prevNonWs >= 0 && text[prevNonWs] == '.';
                if (isProperty)
                {
                    WriteDefault(word);
                    continue;
                }
                // 链头：解析整条链 a.b.c 做语义检查
                var segs = ParseChain(text, start, i);
                if (segs.Count > 1 && engine != null)
                {
                    RenderChain(text, segs, engine, ref i);
                    continue;
                }
                // 单独标识符：函数调用检查
                int nextNonWs = i;
                while (nextNonWs < text.Length && char.IsWhiteSpace(text[nextNonWs])) nextNonWs++;
                bool isCall = nextNonWs < text.Length && text[nextNonWs] == '(';
                if (isCall && engine != null)
                {
                    var v = engine.GetValue(word);
                    if (v.IsCallable()) Color(220, 220, 170, word);
                    else Color(244, 71, 71, word);
                    continue;
                }
                // 全大写常量
                if (IsAllUpper(word)) { Color(79, 193, 255, word); continue; }
                // 类型名：首字母大写
                if (char.IsUpper(word[0])) { Color(78, 201, 176, word); continue; }
                // 普通标识符
                WriteDefault(word);
                continue;
            }
            // 数字：支持 0x/0b/0o 前缀、BigInt n 后缀、小数、科学计数
            if (char.IsDigit(text[i]) || (text[i] == '.' && i + 1 < text.Length && char.IsDigit(text[i + 1])))
            {
                int start = i;
                if (text[i] == '0' && i + 1 < text.Length && "xXbBoO".IndexOf(text[i + 1]) >= 0)
                {
                    i += 2;
                    while (i < text.Length && (char.IsLetterOrDigit(text[i]) || text[i] == '_')) i++;
                }
                else
                {
                    while (i < text.Length && (char.IsDigit(text[i]) || text[i] == '.' || text[i] == '_'
                        || text[i] == 'e' || text[i] == 'E' || text[i] == 'n')) i++;
                }
                Color(181, 206, 168, text.Substring(start, i - start));
                continue;
            }
            // 操作符
            if ("+-*/%=<>!&|^~?:".IndexOf(text[i]) >= 0)
            {
                Color(212, 212, 212, text[i].ToString());
                i++;
                continue;
            }
            // 其他字符（空格、标点等）：淡青色
            WriteDefault(text[i].ToString());
            i++;
        }
    }

    // 错误行：整行红色，错误位置红底白字突出
    public static void WriteErrorLine(string text, int errorIndex)
    {
        Console.Write("\x1b[38;2;244;71;71m");
        for (int i = 0; i < text.Length; i++)
        {
            if (i == errorIndex)
            {
                Console.Write("\x1b[48;2;180;40;40m\x1b[38;2;255;255;255m");
                Console.Write(text[i]);
                Console.Write("\x1b[49m\x1b[38;2;244;71;71m");
            }
            else Console.Write(text[i]);
        }
        Console.Write("\x1b[39m");
    }

    // 全大写常量判断，至少含一个字母且字母全大写，长度 >= 2
    static bool IsAllUpper(string s)
    {
        if (s.Length < 2) return false;
        bool hasLetter = false;
        foreach (var c in s)
        {
            if (char.IsLetter(c))
            {
                hasLetter = true;
                if (!char.IsUpper(c)) return false;
            }
        }
        return hasLetter;
    }

    // 解析标识符链 a.b.c，返回各段
    static List<(string word, int start, int end)> ParseChain(string text, int start, int end)
    {
        var segs = new List<(string, int, int)>();
        segs.Add((text.Substring(start, end - start), start, end));
        int j = end;
        while (true)
        {
            int dotPos = j;
            while (dotPos < text.Length && char.IsWhiteSpace(text[dotPos])) dotPos++;
            if (dotPos >= text.Length || text[dotPos] != '.') break;
            int idStart = dotPos + 1;
            while (idStart < text.Length && char.IsWhiteSpace(text[idStart])) idStart++;
            if (idStart >= text.Length || !(char.IsLetter(text[idStart]) || text[idStart] == '_' || text[idStart] == '$')) break;
            int idEnd = idStart;
            while (idEnd < text.Length && (char.IsLetterOrDigit(text[idEnd]) || text[idEnd] == '_' || text[idEnd] == '$')) idEnd++;
            segs.Add((text.Substring(idStart, idEnd - idStart), idStart, idEnd));
            j = idEnd;
        }
        return segs;
    }

    // 渲染链式访问，第一段未定义整链红，中段不存在该段红
    static void RenderChain(string text, List<(string word, int start, int end)> segs, Engine engine, ref int i)
    {
        JsValue firstVal;
        try { firstVal = engine.GetValue(segs[0].word); }
        catch { firstVal = JsValue.Undefined; }
        bool firstDefined = !firstVal.IsUndefined();

        if (!firstDefined)
        {
            int pos = segs[0].start;
            foreach (var seg in segs)
            {
                while (pos < seg.start) { WriteDefault(text[pos].ToString()); pos++; }
                Color(244, 71, 71, seg.word);
                pos = seg.end;
            }
            i = segs[^1].end;
            return;
        }

        var w0 = segs[0].word;
        if (IsAllUpper(w0)) Color(79, 193, 255, w0);
        else if (char.IsUpper(w0[0])) Color(78, 201, 176, w0);
        else WriteDefault(w0);
        int p = segs[0].end;

        var currentObj = firstVal;
        for (int k = 1; k < segs.Count; k++)
        {
            var seg = segs[k];
            while (p < seg.start) { WriteDefault(text[p].ToString()); p++; }
            bool exists = false;
            if (currentObj is ObjectInstance oi)
            {
                try
                {
                    var prop = oi.Get(seg.word, oi);
                    exists = !prop.IsUndefined();
                    if (exists) currentObj = prop;
                }
                catch { }
            }
            if (exists) { WriteDefault(seg.word); }
            else
            {
                Color(244, 71, 71, seg.word);
                for (int m = k + 1; m < segs.Count; m++)
                {
                    var seg2 = segs[m];
                    while (p < seg2.start) { WriteDefault(text[p].ToString()); p++; }
                    Color(244, 71, 71, seg2.word);
                    p = seg2.end;
                }
                i = segs[^1].end;
                return;
            }
            p = seg.end;
        }
        i = segs[^1].end;
    }
}