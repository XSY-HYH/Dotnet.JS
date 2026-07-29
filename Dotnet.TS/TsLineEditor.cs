using Jint;
using Jint.Native;
using Jint.Native.Object;

namespace Dotnet.TS;

// TS 行编辑器，支持多行编辑、历史上下键、光标移动、实时语法高亮、Tab 补全
internal class TsLineEditor
{
    private readonly HistoryStore _history;
    private readonly Engine? _engine;
    private string _prompt = "";
    private string _line = "";
    private int _cursor;
    private int _historyIndex;
    private string _savedDraft = "";

    // Tab 补全状态：连续 Tab 时在候选间循环切换
    private List<string>? _tabCandidates;
    private int _tabIndex;
    private int _tabTokenStart;
    private string _tabLineSnapshot = "";
    private int _tabCursorSnapshot;
    private int _lastLines = 1;
    private HashSet<int> _autoClosePositions = new();
    private DateTime _lastKeyTime;
    private bool _pasting;

    public TsLineEditor(Engine? engine = null, HistoryStore? history = null)
    {
        _engine = engine;
        _history = history ?? new HistoryStore();
    }

    // 读取完整输入（可能多行），括号未闭合时 Enter 续行，返回 null 表示 EOF
    public string? ReadLine(string prompt)
    {
        _prompt = prompt;
        Console.Write(prompt);
        _line = "";
        _cursor = 0;
        _historyIndex = _history.Count;
        _savedDraft = "";
        _tabCandidates = null;
        _lastLines = 1;
        _pasting = false;
        _lastKeyTime = default;

        while (true)
        {
            var key = Console.ReadKey(true);
            var now = DateTime.UtcNow;
            if (_lastKeyTime != default)
            {
                var delta = (now - _lastKeyTime).TotalMilliseconds;
                if (delta < 10) _pasting = true;
                else if (delta > 50) _pasting = false;
            }
            _lastKeyTime = now;
            if (key.Key != ConsoleKey.Tab) _tabCandidates = null;

            switch (key.Key)
            {
                case ConsoleKey.Enter:
                    // 括号平衡才提交，否则续行
                    if (BraceMatcher.IsBalanced(_line))
                    {
                        ClearAndNewline();
                        _history.Add(_line);
                        return _line;
                    }
                    _line = _line.Insert(_cursor, "\n");
                    _cursor++;
                    _autoClosePositions.Clear();
                    Redraw();
                    break;
                case ConsoleKey.Backspace when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    if (_cursor > 0)
                    {
                        int nc = WordBoundaryBack(_cursor);
                        _line = _line.Remove(nc, _cursor - nc);
                        _cursor = nc;
                        _autoClosePositions.Clear();
                        Redraw();
                    }
                    break;
                case ConsoleKey.Backspace:
                    if (_cursor > 0)
                    {
                        _line = _line.Remove(_cursor - 1, 1);
                        _cursor--;
                        _autoClosePositions.Clear();
                        Redraw();
                    }
                    break;
                case ConsoleKey.Delete:
                    if (_cursor < _line.Length)
                    {
                        _line = _line.Remove(_cursor, 1);
                        _autoClosePositions.Clear();
                        Redraw();
                    }
                    break;
                case ConsoleKey.LeftArrow when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    _cursor = WordBoundaryBack(_cursor);
                    Redraw();
                    break;
                case ConsoleKey.LeftArrow:
                    if (_cursor > 0) { _cursor--; Redraw(); }
                    break;
                case ConsoleKey.RightArrow when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    _cursor = WordBoundaryForward(_cursor);
                    Redraw();
                    break;
                case ConsoleKey.RightArrow:
                    if (_cursor < _line.Length) { _cursor++; Redraw(); }
                    break;
                case ConsoleKey.Home:
                    _cursor = LineStartOf(_cursor); Redraw();
                    break;
                case ConsoleKey.End:
                    _cursor = LineEndOf(_cursor); Redraw();
                    break;
                // 多行时上下键在行间移动，首行上键/末行下键才触发历史
                case ConsoleKey.UpArrow:
                    if (CurrentRow() > 0) MoveVertical(-1);
                    else BrowseHistory(-1);
                    break;
                case ConsoleKey.DownArrow:
                    if (CurrentRow() < TotalRows() - 1) MoveVertical(1);
                    else BrowseHistory(1);
                    break;
                case ConsoleKey.V when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    _pasting = true;
                    break;
                case ConsoleKey.Escape:
                    _line = "";
                    _cursor = 0;
                    _autoClosePositions.Clear();
                    Redraw();
                    break;
                case ConsoleKey.Tab when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    ShowCompletionList();
                    break;
                case ConsoleKey.Tab:
                    HandleTab();
                    break;
                case ConsoleKey.C when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    // Ctrl+C：清当前编辑行，输出 ^C 换行，返回空输入
                    {
                        int cPhysRow = LogicalToPhysRow(CurrentRow());
                        int cTop = Console.CursorTop - cPhysRow;
                        if (cTop < 0) cTop = 0;
                        for (int i = _lastLines - 1; i >= 0; i--)
                        {
                            try { Console.SetCursorPosition(0, cTop + i); } catch { }
                            Console.Write("\x1b[2K");
                        }
                        try { Console.SetCursorPosition(0, cTop); } catch { }
                        Console.Write(_prompt);
                        TsHighlighter.WriteCtrlC("^C");
                        Console.WriteLine();
                        _lastLines = 1;
                        return "";
                    }
                case ConsoleKey.D when (key.Modifiers & ConsoleModifiers.Control) != 0:
                    if (_line.Length == 0) return null;
                    if (_cursor < _line.Length)
                    {
                        _line = _line.Remove(_cursor, 1);
                        _autoClosePositions.Clear();
                        Redraw();
                    }
                    break;
                default:
                    if (!char.IsControl(key.KeyChar) && key.KeyChar != '\0')
                    {
                        char c = key.KeyChar;
                        // 粘贴模式：直接插入字符，不补全不跳过
                        if (_pasting)
                        {
                            _line = _line.Insert(_cursor, c.ToString());
                            AdjustPositions(_cursor, +1);
                            _cursor++;
                            Redraw();
                            break;
                        }
                        // 闭符号跳过：光标后是补全的闭符号则跳过（VSCode 风格）
                        if (IsCloseSymbol(c) && _cursor < _line.Length
                            && _line[_cursor] == c && _autoClosePositions.Contains(_cursor))
                        {
                            _autoClosePositions.Remove(_cursor);
                            _cursor++;
                            Redraw();
                            break;
                        }
                        // 自动配对括号引号，光标停在中间
                        char? close = c switch
                        {
                            '(' => ')',
                            '{' => '}',
                            '[' => ']',
                            '\'' => '\'',
                            '"' => '"',
                            _ => null
                        };
                        if (close != null)
                        {
                            // 光标在同名括号/引号对中间，再输入开符号不插入
                            if (_cursor > 0 && _line[_cursor - 1] == c
                                && _cursor < _line.Length && _line[_cursor] == close)
                            {
                                // 忽略
                            }
                            else
                            {
                                _line = _line.Insert(_cursor, $"{c}{close}");
                                AdjustPositions(_cursor, +1);
                                _cursor++;
                                _autoClosePositions.Add(_cursor);
                            }
                        }
                        else
                        {
                            _line = _line.Insert(_cursor, c.ToString());
                            AdjustPositions(_cursor, +1);
                            _cursor++;
                        }
                        Redraw();
                    }
                    break;
            }
        }
    }

    private void BrowseHistory(int direction)
    {
        if (direction < 0)
        {
            if (_historyIndex <= 0) return;
            if (_historyIndex == _history.Count) _savedDraft = _line;
            _historyIndex--;
        }
        else
        {
            if (_historyIndex >= _history.Count) return;
            _historyIndex++;
        }
        _line = _historyIndex == _history.Count
            ? _savedDraft
            : _history[_historyIndex];
        _cursor = _line.Length;
        _autoClosePositions.Clear();
        Redraw();
    }

    // 实时语法检测 + 重绘，按 \n 分逻辑行，单行超宽自动折物理行
    private void Redraw()
    {
        var err = _engine != null ? TsErrorChecker.CheckSyntax(_engine, _line, 0) : null;
        int width = ConsoleWidth();

        var segments = _line.Split('\n');

        // 光标逻辑行/逻辑列（含前缀长度）
        int cursorLogicalRow = 0, cursorLogicalCol = _prompt.Length;
        for (int i = 0; i < _cursor; i++)
        {
            if (_line[i] == '\n') { cursorLogicalRow++; cursorLogicalCol = 1; }
            else cursorLogicalCol++;
        }

        // err 逻辑行/行内列
        int errLogicalRow = 0, errColInRow = 0;
        if (err != null)
        {
            for (int i = 0; i < err.Value.Index && i < _line.Length; i++)
            {
                if (_line[i] == '\n') { errLogicalRow++; errColInRow = 0; }
                else errColInRow++;
            }
        }

        // 每个逻辑行前缀长度与物理行数，physOffset[i] 为该行起始物理行偏移
        int[] prefixLens = new int[segments.Length];
        int[] physRows = new int[segments.Length];
        int[] physOffset = new int[segments.Length + 1];
        int totalPhysRows = 0;
        for (int i = 0; i < segments.Length; i++)
        {
            prefixLens[i] = i == 0 ? _prompt.Length : 1;
            physRows[i] = PhysicalRowsOf(segments[i], prefixLens[i], width);
            physOffset[i] = totalPhysRows;
            totalPhysRows += physRows[i];
        }
        physOffset[segments.Length] = totalPhysRows;

        int errPhysRows = err != null ? 1 : 0;
        int totalLines = totalPhysRows + errPhysRows;
        int clearLines = Math.Max(totalLines, _lastLines);

        // 光标物理行/列
        int cursorPhysRow = physOffset[cursorLogicalRow] + cursorLogicalCol / width;
        int cursorPhysCol = cursorLogicalCol % width;

        int startTop = Console.CursorTop - cursorPhysRow;
        if (startTop < 0) startTop = 0;

        for (int i = clearLines - 1; i >= 0; i--)
        {
            try { Console.SetCursorPosition(0, startTop + i); } catch { }
            Console.Write("\x1b[2K");
        }
        _lastLines = totalLines;

        for (int li = 0; li < segments.Length; li++)
        {
            try { Console.SetCursorPosition(0, startTop + physOffset[li]); } catch { }
            Console.Write(li == 0 ? _prompt : ".");
            if (err != null && li == errLogicalRow)
                TsHighlighter.WriteErrorLine(segments[li], errColInRow);
            else
                TsHighlighter.WriteHighlighted(segments[li], _engine);
        }

        if (err != null)
        {
            int errDisplayCol = prefixLens[errLogicalRow] + errColInRow;
            int errPhysCol = errDisplayCol % width;
            try { Console.SetCursorPosition(0, startTop + totalPhysRows); } catch { }
            Console.Write(new string(' ', errPhysCol));
            Console.Write($"\x1b[38;2;244;71;71m^ {err.Value.Message}\x1b[39m");
        }

        try { Console.SetCursorPosition(cursorPhysCol, startTop + cursorPhysRow); } catch { }
    }

    // Enter 提交时清错误行，光标移到代码末尾换行
    private void ClearAndNewline()
    {
        int cursorPhysRow = LogicalToPhysRow(CurrentRow());
        int startTop = Console.CursorTop - cursorPhysRow;
        if (startTop < 0) startTop = 0;
        int totalPhysRows = TotalPhysRows();
        for (int i = _lastLines - 1; i >= totalPhysRows; i--)
        {
            try { Console.SetCursorPosition(0, startTop + i); } catch { }
            Console.Write("\x1b[2K");
        }
        try { Console.SetCursorPosition(0, startTop + totalPhysRows - 1); } catch { }
        Console.WriteLine();
        _lastLines = 1;
    }

    // 光标所在行号（0-based）
    private int CurrentRow()
    {
        int row = 0;
        for (int i = 0; i < _cursor; i++) if (_line[i] == '\n') row++;
        return row;
    }

    // 总行数
    private int TotalRows()
    {
        int row = 1;
        for (int i = 0; i < _line.Length; i++) if (_line[i] == '\n') row++;
        return row;
    }

    // 终端宽度，异常或过小时兜底 80
    private static int ConsoleWidth()
    {
        try { int w = Console.WindowWidth; return w < 2 ? 80 : w; }
        catch { return 80; }
    }

    // 逻辑行占的物理行数，prefixLen 为行前缀长度（首行 prompt，续行 1 个点）
    private static int PhysicalRowsOf(string segment, int prefixLen, int width)
    {
        int len = prefixLen + segment.Length;
        if (len == 0) return 1;
        return (len - 1) / width + 1;
    }

    // 逻辑行号转物理行号（行首偏移）
    private int LogicalToPhysRow(int logicalRow)
    {
        var segments = _line.Split('\n');
        int phys = 0;
        for (int i = 0; i < logicalRow && i < segments.Length; i++)
        {
            int prefixLen = i == 0 ? _prompt.Length : 1;
            phys += PhysicalRowsOf(segments[i], prefixLen, ConsoleWidth());
        }
        return phys;
    }

    // 所有逻辑行占的总物理行数
    private int TotalPhysRows()
    {
        var segments = _line.Split('\n');
        int width = ConsoleWidth();
        int phys = 0;
        for (int i = 0; i < segments.Length; i++)
        {
            int prefixLen = i == 0 ? _prompt.Length : 1;
            phys += PhysicalRowsOf(segments[i], prefixLen, width);
        }
        return phys;
    }

    // pos 所在行的起始 index
    private int LineStartOf(int pos)
    {
        int p = pos;
        while (p > 0 && _line[p - 1] != '\n') p--;
        return p;
    }

    // pos 所在行的末尾 index（指向 \n 或 Length）
    private int LineEndOf(int pos)
    {
        int p = pos;
        while (p < _line.Length && _line[p] != '\n') p++;
        return p;
    }

    // 上下移动一行，列对齐到较短行末尾
    private void MoveVertical(int dir)
    {
        int curStart = LineStartOf(_cursor);
        int col = _cursor - curStart;
        if (dir < 0)
        {
            if (curStart == 0) return;
            int prevEnd = curStart - 1;
            int prevStart = LineStartOf(prevEnd);
            _cursor = Math.Min(prevStart + col, prevEnd);
        }
        else
        {
            int curEnd = LineEndOf(_cursor);
            if (curEnd >= _line.Length) return;
            int nextStart = curEnd + 1;
            int nextEnd = LineEndOf(nextStart);
            _cursor = Math.Min(nextStart + col, nextEnd);
        }
        Redraw();
    }

    private void HandleTab()
    {
        if (_engine == null) return;
        var engine = _engine;

        if (_tabCandidates != null
            && _tabCursorSnapshot == _cursor
            && _tabLineSnapshot == _line)
        {
            _tabIndex = (_tabIndex + 1) % _tabCandidates.Count;
            ReplaceCompletion(_tabTokenStart, _tabCandidates[_tabIndex]);
            return;
        }

        int end = _cursor;
        int start = end;
        while (start > 0 && IsIdentChar(_line[start - 1])) start--;
        var prefix = _line.Substring(start, end - start);

        List<string> candidates;
        if (start > 0 && _line[start - 1] == '.')
        {
            var chain = ParsePropertyChain(start - 1);
            candidates = CollectChainCandidates(engine, chain, prefix);
        }
        else
        {
            candidates = CollectGlobalCandidates(engine, prefix);
        }

        if (candidates.Count == 0)
        {
            _tabCandidates = null;
            return;
        }
        _tabCandidates = candidates;
        _tabIndex = 0;
        _tabTokenStart = start;
        ReplaceCompletion(start, candidates[0]);
    }

    // Ctrl+Tab 显示所有候选列表，不补全
    private void ShowCompletionList()
    {
        if (_engine == null) return;
        var engine = _engine;
        int end = _cursor;
        int start = end;
        while (start > 0 && IsIdentChar(_line[start - 1])) start--;
        var prefix = _line.Substring(start, end - start);

        List<string> candidates;
        if (start > 0 && _line[start - 1] == '.')
        {
            var chain = ParsePropertyChain(start - 1);
            candidates = CollectChainCandidates(engine, chain, prefix);
        }
        else
        {
            candidates = CollectGlobalCandidates(engine, prefix);
        }

        if (candidates.Count == 0) return;
        Console.WriteLine();
        foreach (var c in candidates) { TsHighlighter.WriteHighlighted(c, engine); Console.Write("  "); }
        Console.WriteLine();
        Redraw();
    }

    private List<string> ParsePropertyChain(int dotPos)
    {
        var chain = new List<string>();
        int pos = dotPos;
        while (pos >= 0 && _line[pos] == '.')
        {
            int idEnd = pos;
            int idStart = idEnd;
            while (idStart > 0 && IsIdentChar(_line[idStart - 1])) idStart--;
            if (idStart == idEnd) break;
            chain.Add(_line.Substring(idStart, idEnd - idStart));
            pos = idStart - 1;
        }
        chain.Reverse();
        return chain;
    }

    private List<string> CollectChainCandidates(Engine engine, List<string> chain, string prefix)
    {
        var set = new HashSet<string>();
        if (chain.Count == 0) return set.ToList();
        var v = engine.GetValue(chain[0]);
        for (int k = 1; k < chain.Count; k++)
        {
            if (v is ObjectInstance oi) v = oi.Get(JsValue.FromObject(engine, chain[k]));
            else { v = JsValue.Undefined; break; }
        }
        if (v is ObjectInstance target)
        {
            foreach (var key in target.GetOwnPropertyKeys())
            {
                if (key.IsString())
                {
                    var name = key.AsString();
                    if (name.StartsWith(prefix, StringComparison.Ordinal) && name.Length > prefix.Length)
                        set.Add(name);
                }
            }
        }
        return set.OrderBy(x => x).ToList();
    }

    private void ReplaceCompletion(int tokenStart, string candidate)
    {
        _line = _line.Remove(tokenStart, _cursor - tokenStart);
        _line = _line.Insert(tokenStart, candidate);
        _cursor = tokenStart + candidate.Length;
        _tabLineSnapshot = _line;
        _tabCursorSnapshot = _cursor;
        Redraw();
    }

    private List<string> CollectGlobalCandidates(Engine engine, string prefix)
    {
        var set = new HashSet<string>();
        foreach (var k in engine.Global.GetOwnPropertyKeys())
        {
            if (k.IsString())
            {
                var name = k.AsString();
                if (name.StartsWith(prefix, StringComparison.Ordinal) && name.Length > prefix.Length)
                    set.Add(name);
            }
        }
        foreach (var kw in TsHighlighter.Keywords)
            if (kw.StartsWith(prefix, StringComparison.Ordinal) && kw.Length > prefix.Length)
                set.Add(kw);
        return set.OrderBy(x => x).ToList();
    }

    private int WordBoundaryBack(int pos)
    {
        int p = pos;
        while (p > 0 && !IsIdentChar(_line[p - 1])) p--;
        while (p > 0 && IsIdentChar(_line[p - 1])) p--;
        return p;
    }

    private int WordBoundaryForward(int pos)
    {
        int p = pos;
        while (p < _line.Length && IsIdentChar(_line[p])) p++;
        while (p < _line.Length && !IsIdentChar(_line[p])) p++;
        return p;
    }

    private static bool IsIdentChar(char c) => char.IsLetterOrDigit(c) || c == '_' || c == '$';

    private static bool IsCloseSymbol(char c) => c == ')' || c == ']' || c == '}' || c == '\'' || c == '"';

    private static char MatchingOpen(char close) => close switch
    {
        ')' => '(', ']' => '[', '}' => '{', _ => close
    };

    // 编辑后调整补全闭符号位置标记
    private void AdjustPositions(int editPos, int delta)
    {
        if (_autoClosePositions.Count == 0) return;
        var newSet = new HashSet<int>();
        foreach (var p in _autoClosePositions)
        {
            if (p >= editPos) newSet.Add(p + delta);
            else newSet.Add(p);
        }
        _autoClosePositions = newSet;
    }
}