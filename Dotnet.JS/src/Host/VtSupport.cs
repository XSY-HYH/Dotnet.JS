using System.Runtime.InteropServices;

namespace Dotnet.JS.Host;

// Windows 启用 VT 处理，让控制台解释 ANSI 转义码
internal static class VtSupport
{
    const int STD_OUTPUT_HANDLE = -11;
    const uint ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

    [DllImport("kernel32.dll")]
    private static extern IntPtr GetStdHandle(int nStdHandle);

    [DllImport("kernel32.dll")]
    private static extern bool GetConsoleMode(IntPtr h, out uint mode);

    [DllImport("kernel32.dll")]
    private static extern bool SetConsoleMode(IntPtr h, uint mode);

    public static void TryEnable()
    {
        if (!OperatingSystem.IsWindows()) return;
        try
        {
            var h = GetStdHandle(STD_OUTPUT_HANDLE);
            if (GetConsoleMode(h, out uint mode))
                SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
        }
        catch { }
    }
}
