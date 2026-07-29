namespace Dotnet.TS;

// REPL 输入历史，连续重复去重，上限 500 条
internal class HistoryStore
{
    private readonly List<string> _items = new();
    private const int MaxSize = 500;

    public int Count => _items.Count;
    public string this[int i] => _items[i];

    public void Add(string line)
    {
        if (string.IsNullOrWhiteSpace(line)) return;
        if (_items.Count > 0 && _items[^1] == line) return;
        _items.Add(line);
        if (_items.Count > MaxSize) _items.RemoveAt(0);
    }
}
