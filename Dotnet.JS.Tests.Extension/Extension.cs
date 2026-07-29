using Jint;

namespace Dotnet.JS.Tests.Extension;

// 测试扩展，验证 loadExtension 加载 dll + 调 Initialize 注册 API
public class Extension
{
    public void Initialize(Engine engine)
    {
        engine.SetValue("extGreeting", "hello from extension");
        engine.SetValue("extAdd", new Func<int, int, int>((a, b) => a + b));
    }
}
