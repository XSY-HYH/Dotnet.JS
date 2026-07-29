using Jint;
using Jint.Native;
using Jint.Native.Object;
using Jint.Runtime;

namespace Dotnet.JS.Extensions;

// 注册扩展加载全局 API：__load_extension
internal static class ExtensionApi
{
    public static void Register(Engine engine)
    {
        engine.SetValue("__load_extension", new Func<string, JsObject>(path => ExtensionLoader.Load(engine, path)));
    }
}
