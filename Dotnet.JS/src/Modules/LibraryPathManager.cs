using System.IO;
using Jint;

namespace Dotnet.JS.Modules;

// require 的库路径管理
internal class LibraryPathManager
{
    private readonly string _exeDir;
    private readonly List<string> _paths = new();

    public LibraryPathManager()
    {
        // 单文件发布下 GetEntryAssembly().Location 返回空串，用 AppContext.BaseDirectory 兜底
        _exeDir = AppContext.BaseDirectory;
        _paths.Add(Path.GetFullPath(Path.Combine(_exeDir, "lib")));
        _paths.Add(Path.GetFullPath("./lib"));
    }

    public IReadOnlyList<string> GetPaths() => _paths;

    public void AddPath(string path)
    {
        var fullPath = Path.GetFullPath(path);
        if (!Directory.Exists(fullPath))
            Directory.CreateDirectory(fullPath);
        _paths.Insert(0, fullPath);
    }

    public void Refresh()
    {
        _paths.Clear();
        _paths.Add(Path.GetFullPath(Path.Combine(_exeDir, "lib")));
        _paths.Add(Path.GetFullPath("./lib"));
    }

    public void Register(Engine engine)
    {
        engine.SetValue("__lib_refresh", new Action(Refresh));
        engine.SetValue("__lib_addPath", new Action<string>(AddPath));
        engine.SetValue("__lib_getPaths", new Func<string[]>(() => _paths.ToArray()));
    }
}
