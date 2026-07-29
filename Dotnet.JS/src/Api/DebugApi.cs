using Jint;
using Jint.Native;
using Jint.Runtime.Interop;

namespace Dotnet.JS.Api;

// __debug 开关和调试输出
internal static class DebugApi
{
    private static bool _enabled;

    public static bool IsEnabled => _enabled;

    public static void Register(Engine engine)
    {
        engine.SetValue("__debug", new Action<bool>(enable => _enabled = enable));

        engine.SetValue("__debugPrint", new Action<string>(message =>
        {
            if (!_enabled) return;
            var oldColor = Console.ForegroundColor;
            try
            {
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine($"[DEBUG] {message}");
            }
            finally { Console.ForegroundColor = oldColor; }
        }));
    }
}
