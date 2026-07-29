# Dotnet.JS

基于 .NET 与 Jint 的 JavaScript 运行时，让 JS 直接调用 .NET BCL。

## 设计理念

- C# 层只暴露底层 CLR 桥接：程序集加载、类型查找、方法调用、属性读写
- 业务能力全靠 JS 标准库，标准库 `require('dotnet')` 桥接 BCL 实现
- 标准 API 对齐 .NET BCL 命名（`readAllText` / `getFiles` / `callStatic`），不照搬其他运行时
- 跨平台，不使用平台特定 API

## 标准库

`lib/std/` 下按 BCL 命名空间组织，每个模块优先封装底层依赖，上层模块依赖底层模块工作：

| 模块 | 桥接的 BCL |
|------|-----------|
| `dotnet` | CLR 底层桥接（程序集/类型/方法/属性） |
| `console` | System.Console |
| `fs` | System.IO.File / Directory |
| `path` | System.IO.Path |
| `os` | System.Environment |
| `process` | 进程参数（host 注入） |
| `text` | System.Text.Encoding / RegularExpressions |
| `text_builder` | System.Text.StringBuilder |
| `time` | System.DateTime / TimeSpan |
| `json` | JSON 序列化 |
| `math` | System.Math（JS Math 没有的扩展） |
| `bit_converter` | System.BitConverter |
| `guid` | System.Guid |
| `convert` | System.Convert（base64/十六进制/类型转换） |
| `crypto` | System.Security.Cryptography（哈希/HMAC/随机数） |
| `uri` | System.Net.WebUtility / System.Uri |
| `random` | System.Random |
| `gc` | System.GC |
| `globalization` | System.Globalization.CultureInfo |
| `app` | System.AppContext |
| `thread` | System.Threading.Thread（sleep） |
| `tasks` | System.Threading.Tasks.Task |
| `xml` | System.Xml.XmlDocument / XmlNode |
| `io/stream` | System.IO.Stream / StreamReader / StreamWriter |
| `io/compression` | System.IO.Compression.ZipFile / ZipArchive |
| `diagnostics` | System.Diagnostics.Stopwatch / Process / Trace / Debug |
| `net/http` | System.Net.Http.HttpClient |
| `net/dns` | System.Net.Dns |
| `net/ip` | System.Net.IPAddress |

函数清单见 [docs/api.md](docs/api.md)。

## 模块化

- `require` 加载 `lib/std` 下的模块，IIFE 包装隔离作用域
- 模块顶层 `var` 不泄漏到全局
- 启动时 `bootstrap.js` 注册全局 `console` / `process`

## REPL 控制台

启动后进入交互式 REPL，自带行编辑器（`src/Repl/Editor/`），不依赖第三方 readline 库：

**语法高亮** — ANSI 真彩色，配色参考 VSCode Dark+，token 分类参考 TypeScript.tmTheme：
- 注释绿、字符串橙、关键字蓝、数字浅绿
- 已定义函数调用黄、未定义函数调用红（语义检查，查 engine 运行时状态）
- 类型名（首字母大写）青绿、全大写常量浅蓝、操作符亮白

**Tab 补全**：
- `Tab` 补全第一个候选，再 `Tab` 在候选间循环切换
- `Ctrl+Tab` 只列出所有候选，不补全
- 支持链式属性补全：`console.log.` 能补全 log 的属性
- 标识符前缀匹配全局变量 + 关键字，`name.` 形式匹配对象属性

**实时错误检测** — 用 Esprima 解析当前行，语法错误时整行标红，错误位置字符红底白字，下方 `^ 错误消息` 标记。多行输入时用累积代码检测，错误映射到当前行。

**编辑操作**：
- `Ctrl+Backspace` 删除前一词，`Ctrl+Left` / `Ctrl+Right` 按词跳转
- `Home` / `End` 行首行尾，`Backspace` / `Delete` 删除
- `↑` / `↓` 浏览历史输入
- `Esc` 清空当前行，`Ctrl+D` 空行退出，`Ctrl+C` 退出

**多行输入** — 输入未闭合（括号/引号不匹配）时自动切换续行提示符 `.`，累积代码闭合后统一执行。

Windows 启动时自动启用 VT（Virtual Terminal）支持以解释 ANSI 转义码，跨平台用 `Console.ReadKey` + `ConsoleColor`，不使用平台特定 API。

## 底层桥接约定

JS 侧通过 `dotnet` 模块调用 CLR：

```javascript
var dn = require('dotnet');
var File = dn.type('System.IO.File');
var exists = dn.callStatic(File, 'Exists', ['/path/to/file']);
```

- `type(name)` 按类型名查找 CLR 类型
- `callStatic(type, method, args)` 调用静态方法
- `callInstance(type, instance, method, args)` 调用实例方法
- `getProperty(type, name)` / `setProperty(type, name, value)` 读写静态成员
- `createInstance(type, args)` 构造实例

重载决议基于参数类型打分，`params` 参数同时支持数组传参和 spread 调用。

运行时本身注入的全局底层符号（`__load_assembly` / `__load_assembly_from` / `__find_type` / `__native_load` / `__native_get_proc` / `__native_call` / `__lib_*` / `__debug*` / `require`，以及 TypeWrapper 和程序集包装对象的完整接口）见 [docs/api.md](docs/api.md) 的"运行时底层 API"章节。
