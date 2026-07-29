using System.Reflection;
using Jint;
using Dotnet.JS.Api;
using Dotnet.JS.Interop;
using Dotnet.JS.Modules;
using Dotnet.JS.Repl;
using Dotnet.JS.Extensions;

namespace Dotnet.JS.Host;

// 总入口，配置 Engine 并注册所有 API 模块
internal class JintHost
{
    private readonly Engine _engine;
    private readonly LibraryPathManager _libraryPaths;
    private readonly ModuleResolver _moduleResolver;
    private readonly ScriptRunner _scriptRunner;

    public JintHost()
    {
        _engine = new Engine(options =>
        {
            options.AllowClr();
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                try { options.AllowClr(asm); }
                catch { /* 某些动态程序集无法注册，跳过 */ }
            }
        });

        _libraryPaths = new LibraryPathManager();
        _moduleResolver = new ModuleResolver(_engine, _libraryPaths);
        _scriptRunner = new ScriptRunner(_engine);

        RegisterAll();
        LoadBootstrap();
    }

    private void RegisterAll()
    {
        DebugApi.Register(_engine);
        ClrAssemblyLoader.Register(_engine);
        ExtensionApi.Register(_engine);
        NativeInterop.Register(_engine);
        _libraryPaths.Register(_engine);
        _moduleResolver.Register();
    }

    // 加载 lib/bootstrap.js 注册全局 console/process 等 JS 标准库
    private void LoadBootstrap()
    {
        var paths = _libraryPaths.GetPaths();
        foreach (var p in paths)
        {
            var bootstrapPath = Path.Combine(p, "bootstrap.js");
            if (File.Exists(bootstrapPath))
            {
                _engine.Execute(File.ReadAllText(bootstrapPath));
                return;
            }
        }
    }

    public int Run(string[] args)
    {
        if (args.Length == 0)
        {
            if (_scriptRunner.RunMain()) return Environment.ExitCode;
            new ReplLoop(_engine).Run();
            return 0;
        }
        return _scriptRunner.RunScript(args[0], args.Skip(1).ToArray());
    }
}
