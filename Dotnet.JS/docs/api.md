# Dotnet.JS 标准 API

所有模块通过 `require('std/<name>')` 加载，`console` 和 `process` 由 bootstrap 注册为全局。返回 CLR 对象的函数，对象保留 CLR 身份，可继续作为实例参数传给 `dn.callInstance` 或 `dn.getInstanceProperty`。

## 运行时底层 API

Dotnet.JS 运行时启动时向 JS 注入以下全局符号，标准库均建立在其上。普通脚本一般不需要直接调用，但可以用来桥接标准库尚未覆盖的 BCL 能力。

### 程序集与类型

| 全局函数 | 说明 |
|---------|------|
| `__load_assembly(name)` | 按名称加载 CLR 程序集，返回程序集包装对象 |
| `__load_assembly_from(path)` | 按路径加载程序集，返回程序集包装对象 |
| `__find_type(typeName)` | 按全名查找类型，先遍历已加载程序集，找不到则全量加载 System.*.dll 后重试，返回 TypeWrapper |

程序集包装对象（`__load_assembly` / `__load_assembly_from` 返回）：

| 成员 | 说明 |
|------|------|
| `name` | 程序集名 |
| `getType(typeName)` | 取类型，返回 TypeWrapper |
| `getTypes()` | 全部类型全名数组 |

TypeWrapper 对象（`__find_type` / `getType` 返回）：

| 成员 | 说明 |
|------|------|
| `name` | 类型全名 |
| `createInstance(...args)` | 构造实例，按构造函数重载决议 |
| `callStatic(methodName, ...args)` | 调用静态方法 |
| `callInstance(instance, methodName, ...args)` | 调用实例方法 |
| `getProperty(name)` | 读静态属性或字段 |
| `setProperty(name, value)` | 写静态属性或字段 |
| `getInstanceProperty(instance, name)` | 读实例属性或字段 |
| `setInstanceProperty(instance, name, value)` | 写实例属性或字段 |

重载决议按参数类型打分：整数优先 `int`，负数排除无符号类型，小数优先 `double`。`params` 参数同时支持数组传参和 spread 调用。**委托类型参数支持传入 JS 函数**，运行时自动按签名生成委托适配器，参数与返回值双向转换。

类型：

| 对象 | 说明 |
|------|------|
| 程序集包装对象 | 含 `name` / `getType` / `getTypes` |
| TypeWrapper | 类型入口，所有方法调用的起点 |
| NativeHandle | native 互操作返回的句柄，`toString` 显示十六进制地址 |

### Native 互操作

桥接非托管库，绕过 CLR 直接调用 native 函数。句柄以 NativeHandle 对象传递，`toString` 显示十六进制地址。

| 全局函数 | 说明 |
|---------|------|
| `__native_load(name)` | 加载 native 库，返回 NativeHandle |
| `__native_get_proc(handle, procName)` | 取函数指针，返回 NativeHandle |
| `__native_call(handle, argTypes, args, returnType?)` | 调用 native 函数，returnType 默认 `void`，`intptr`/`ptr` 返回 NativeHandle |
| `__native_ptr_to_string(handle)` | ANSI 字符串指针转 JS 字符串 |
| `__native_ptr_to_wstring(handle)` | Unicode 字符串指针转 JS 字符串 |
| `__native_free(handle)` | 卸载 native 库 |

`argTypes` / `returnType` 取值：

| 类型串 | 说明 |
|--------|------|
| `void` | 仅用于返回值，无返回 |
| `int` / `uint` | 32 位整数 |
| `long` / `ulong` | 64 位整数 |
| `intptr` / `ptr` | 指针，参数可传 `0` 表示 NULL 或 NativeHandle |
| `string` | ANSI 字符串（LPStr） |
| `wstring` | Unicode 字符串（LPWStr） |
| `float` / `double` | 浮点 |
| `bool` | 布尔 |

Windows API 自动用 StdCall，其它平台用 Cdecl。委托类型按签名缓存。

```javascript
var k = __native_load('kernel32.dll');
var ls = __native_get_proc(k, 'lstrlenW');
var len = __native_call(ls, ['wstring'], ['你好'], 'int');
// len === 2

var u = __native_load('user32.dll');
var mb = __native_get_proc(u, 'MessageBoxW');
__native_call(mb, ['intptr','wstring','wstring','uint'], [0, '内容', '标题', 0x40], 'int');
```

### 模块系统

`require(id)` 加载模块，向模块作用域注入 `module` / `exports` / `__filename` / `__dirname`，IIFE 包装隔离顶层变量。路径解析规则：

- `./xxx` / `../xxx` 相对当前模块 `__dirname`
- 裸名（如 `dotnet`、`std/console`）在库搜索路径下查找，自动尝试 `std/` / `modules/` / `lib/` 子目录及 `.js` / `.json` 扩展名

库搜索路径管理：

| 全局函数 | 说明 |
|---------|------|
| `__lib_refresh()` | 重置为默认库路径（exe 同级 lib 与当前目录 lib） |
| `__lib_addPath(path)` | 添加库搜索路径，插到最前 |
| `__lib_getPaths()` | 获取当前库搜索路径数组 |

```javascript
__lib_addPath('D:/mylibs');
console.log(__lib_getPaths());
```

### 调试

| 全局函数 | 说明 |
|---------|------|
| `__debug(enable)` | 开关调试输出 |
| `__debugPrint(msg)` | 调试输出，仅 `__debug(true)` 后生效，青色前缀 `[DEBUG]` |

```javascript
__debug(true);
__debugPrint('查看变量值');
```

### bootstrap 注册的全局

| 全局 | 说明 |
|------|------|
| `console` | `require('std/console')` 的导出 |
| `process` | `require('std/process')` 的导出 |

## 底层桥接 `require('dotnet')`

CLR 类型与方法调用的底层封装，其他标准库均依赖此模块。

| 函数 | 说明 |
|------|------|
| `load(name)` | 按程序集名加载并缓存，返回程序集对象 |
| `loadFrom(path)` | 按路径加载程序集 |
| `type(name)` | 按类型全名查找 CLR 类型，遍历已加载程序集 |
| `getType(assembly, name)` | 从指定程序集获取类型，assembly 可是程序集对象或名字符串 |
| `createInstance(type, args)` | 构造实例 |
| `callStatic(type, method, args)` | 调用静态方法 |
| `callInstance(type, instance, method, args)` | 调用实例方法 |
| `getProperty(type, name)` | 读取静态属性或字段 |
| `setProperty(type, name, value)` | 写入静态属性或字段 |
| `getInstanceProperty(type, instance, name)` | 读取实例属性或字段 |
| `setInstanceProperty(type, instance, name, value)` | 写入实例属性或字段 |

类型：`load`/`loadFrom` 返回程序集包装对象；`type`/`getType` 返回 TypeWrapper；`createInstance` 返回 CLR 实例对象；属性读写函数返回值经 `ToJsValue` 转换（CLR 集合转 JsArray，其它保留 CLR 身份）。

委托适配：当目标参数为委托类型（如 `MathOp`、`Func<...>`、`Action<...>`）时，可直接传 JS 函数，运行时编译匹配签名的委托。

```javascript
var dn = require('dotnet');

// 加载自定义程序集
var lib = dn.loadFrom('D:/path/MyLib.dll');
var Calc = dn.getType(lib, 'MyLib.Calculator');
var calc = dn.createInstance(Calc, []);

// 静态方法
console.log(dn.callStatic(Calc, 'Add', [3, 4]));

// 委托参数：直接传 JS 函数
console.log(dn.callInstance(Calc, calc, 'Apply', [function(a, b) { return a + b; }, 3, 4]));

// 实例属性
dn.setInstanceProperty(Calc, calc, 'Name', 'demo');
console.log(dn.getInstanceProperty(Calc, calc, 'Name'));
```

## 全局 `console`

桥接 System.Console。

| 函数 | 说明 |
|------|------|
| `log(...args)` | WriteLine 输出，参数空格拼接 |
| `write(...args)` | Write 输出，不换行 |
| `info(...args)` | 同 log |
| `debug(...args)` | 输出加 `[DEBUG]` 前缀 |
| `warn(...args)` | 输出加 `[WARN]` 前缀 |
| `error(...args)` | 输出加 `[ERROR]` 前缀 |
| `clear()` | 清屏 |
| `setColor(color)` | 设置前景色，color 为 ConsoleColor 枚举名（Red/Green/...） |
| `setBackgroundColor(color)` | 设置背景色 |
| `resetColor()` | 重置颜色 |

类型：`setColor`/`setBackgroundColor` 的 color 参数为字符串枚举名（`'Red'`/`'Green'`/`'Cyan'` 等），无返回值。

```javascript
console.log('hello', 123, { a: 1 });
console.setColor('Cyan');
console.log('青色文本');
console.resetColor();
console.warn('警告信息');
```

## 全局 `process`

| 属性 | 说明 |
|------|------|
| `process.argv` | 命令行参数数组，host 启动时注入 |
| `process.argv0` | 第一个参数（程序名） |

类型：`argv` 为字符串数组，`argv0` 为字符串。

```javascript
console.log('argv:', process.argv);
console.log('argv0:', process.argv0);
```

## `require('std/fs')`

桥接 System.IO.File / Directory。

| 函数 | 说明 |
|------|------|
| `readAllText(path)` | 读全部文本 |
| `readAllLines(path)` | 读全部行，返回数组 |
| `readAllBytes(path)` | 读全部字节 |
| `writeAllText(path, content)` | 写文本 |
| `writeAllLines(path, lines)` | 写多行 |
| `writeAllBytes(path, bytes)` | 写字节 |
| `appendAllText(path, content)` | 追加文本 |
| `appendAllLines(path, lines)` | 追加多行 |
| `exists(path)` | 文件是否存在 |
| `remove(path)` | 删除文件 |
| `copy(src, dst, overwrite)` | 复制文件，overwrite 默认 true |
| `move(src, dst)` | 移动文件 |
| `getCreationTime(path)` | 创建时间 |
| `getLastWriteTime(path)` | 最后写入时间 |
| `getLastAccessTime(path)` | 最后访问时间 |
| `setCreationTime(path, time)` | 设置创建时间 |
| `setLastWriteTime(path, time)` | 设置最后写入时间 |
| `getFiles(path, pattern?)` | 列出文件，可选通配符 |
| `getDirectories(path, pattern?)` | 列出目录，可选通配符 |
| `createDirectory(path)` | 创建目录 |
| `deleteDirectory(path, recursive)` | 删除目录，recursive 为 true 才递归 |
| `directoryExists(path)` | 目录是否存在 |
| `getCurrentDirectory()` | 当前工作目录 |
| `setCurrentDirectory(path)` | 设置工作目录 |

类型：`readAllBytes`/`writeAllBytes` 的字节为数字数组；`readAllLines`/`getFiles`/`getDirectories` 返回字符串数组；时间函数返回 DateTime 对象（保留 CLR 身份）。

```javascript
var fs = require('std/fs');
var path = require('std/path');

var p = path.join(path.getTempPath(), 'dotnetjs_demo.txt');
fs.writeAllText(p, '第一行\n第二行');
console.log('exists:', fs.exists(p));
console.log('content:', fs.readAllText(p));
console.log('lines:', fs.readAllLines(p));
console.log('bytes:', fs.readAllBytes(p));

fs.appendAllText(p, '\n追加内容');
var dir = path.join(path.getTempPath(), 'demo_dir');
fs.createDirectory(dir);
console.log('dir exists:', fs.directoryExists(dir));
fs.deleteDirectory(dir, true);
fs.remove(p);
```

## `require('std/path')`

桥接 System.IO.Path。

| 函数 | 说明 |
|------|------|
| `combine(...paths)` | 拼接路径 |
| `getFullPath(p)` | 绝对路径 |
| `getFileName(p)` | 文件名（含扩展名） |
| `getFileNameWithoutExtension(p)` | 文件名（不含扩展名） |
| `getDirectoryName(p)` | 目录名 |
| `getExtension(p)` | 扩展名 |
| `changeExtension(p, ext)` | 更改扩展名 |
| `getTempPath()` | 临时目录 |
| `getTempFileName()` | 临时文件名 |
| `hasExtension(p)` | 是否有扩展名 |
| `isPathRooted(p)` | 是否为根路径 |
| `getPathRoot(p)` | 路径根 |
| `directorySeparatorChar` | 目录分隔符 |
| `altDirectorySeparatorChar` | 备用目录分隔符 |
| `pathSeparator` | 路径分隔符 |
| `volumeSeparatorChar` | 卷分隔符 |

类型：所有函数返回字符串，`hasExtension`/`isPathRooted` 返回布尔；分隔符为只读字符串属性。

```javascript
var path = require('std/path');
console.log(path.combine('a', 'b', 'c.txt'));
console.log(path.getExtension('/x/y.txt'));
console.log(path.getFileName('/x/y.txt'));
console.log('sep:', path.directorySeparatorChar);
console.log('rooted:', path.isPathRooted('/x'));
```

## `require('std/os')`

桥接 System.Environment。

| 函数 | 说明 |
|------|------|
| `getEnvironmentVariable(name)` | 读取环境变量 |
| `setEnvironmentVariable(name, value)` | 写入环境变量 |
| `getEnvironmentVariables()` | 全部环境变量 |
| `getCommandLineArgs()` | 命令行参数 |
| `tickCount()` | 系统启动以来的毫秒数（32 位） |
| `tickCount64()` | 系统启动以来的毫秒数（64 位） |
| `osVersion()` | 操作系统版本 |
| `processorCount()` | 处理器数 |
| `workingSet()` | 物理内存使用 |
| `is64BitProcess()` | 是否 64 位进程 |
| `is64BitOperatingSystem()` | 是否 64 位系统 |
| `machineName()` | 机器名 |
| `userName()` | 用户名 |
| `userDomainName()` | 域名 |
| `systemDirectory()` | 系统目录 |
| `currentManagedThreadId()` | 当前托管线程 ID |
| `newline()` | 换行符 |
| `exit(code)` | 退出进程 |
| `failFast(msg)` | 立即终止进程 |

类型：`getEnvironmentVariables` 返回对象（键值对）；`osVersion` 返回 OperatingSystem 对象；其余返回字符串或数字。

```javascript
var os = require('std/os');
console.log('machine:', os.machineName());
console.log('user:', os.userName());
console.log('cpus:', os.processorCount());
console.log('pid thread:', os.currentManagedThreadId());
console.log('HOME:', os.getEnvironmentVariable('HOME') || os.getEnvironmentVariable('USERPROFILE'));
console.log('newline:', JSON.stringify(os.newline()));
```

## `require('std/text')`

桥接 System.Text.Encoding 与 System.Text.RegularExpressions.Regex。

| 函数 | 说明 |
|------|------|
| `utf8()` | UTF8 编码实例 |
| `unicode()` | UTF16 编码实例 |
| `ascii()` | ASCII 编码实例 |
| `utf32()` | UTF32 编码实例 |
| `getDefault()` | 默认编码 |
| `getBytes(str, encoding?)` | 字符串转字节，默认 UTF8 |
| `getString(bytes, encoding?)` | 字节转字符串，默认 UTF8 |
| `getByteCount(str, encoding?)` | 字符串字节长度 |
| `isMatch(input, pattern, options?)` | 是否匹配 |
| `match(input, pattern, options?)` | 单次匹配 |
| `matches(input, pattern, options?)` | 全部匹配 |
| `replace(input, pattern, replacement)` | 正则替换 |
| `split(input, pattern)` | 正则切分 |
| `regexOptions` | RegexOptions 枚举对象（none/ignoreCase/multiline/...） |

类型：`utf8`/`unicode`/`ascii`/`utf32`/`getDefault` 返回 Encoding 对象；`getBytes` 返回数字数组；`getString` 返回字符串；`match`/`matches` 返回 Match / MatchCollection 对象；`regexOptions` 为枚举名到数值的对象。

```javascript
var text = require('std/text');

var bytes = text.getBytes('你好');
console.log('bytes:', bytes);
console.log('string:', text.getString(bytes));
console.log('byteCount:', text.getByteCount('你好'));

console.log('isMatch:', text.isMatch('abc123', '\\d+'));
console.log('replace:', text.replace('a1b2', '\\d', '#'));
console.log('split:', text.split('a,b,,c', ','));
```

## `require('std/time')`

桥接 System.DateTime 与 System.TimeSpan。

| 函数 | 说明 |
|------|------|
| `now()` | 当前本地时间 |
| `utcNow()` | 当前 UTC 时间 |
| `today()` | 今天 0 点 |
| `minValue()` | DateTime 最小值 |
| `maxValue()` | DateTime 最大值 |
| `parse(s)` | 解析字符串 |
| `parseExact(s, format)` | 按格式解析 |
| `tryParse(s)` | 解析失败返回 null |
| `create(year, month, day, hour?, minute?, second?, millisecond?)` | 构造 DateTime |
| `daysInMonth(year, month)` | 当月天数 |
| `isLeapYear(year)` | 是否闰年 |
| `compare(a, b)` | 比较 |
| `fromDays(days)` | TimeSpan 构造 |
| `fromHours(hours)` | TimeSpan 构造 |
| `fromMinutes(minutes)` | TimeSpan 构造 |
| `fromSeconds(seconds)` | TimeSpan 构造 |
| `fromMilliseconds(ms)` | TimeSpan 构造 |
| `fromTicks(ticks)` | TimeSpan 构造 |
| `toString(dt, fmt?)` | DateTime 转字符串，可选格式 |
| `toStringTs(ts, fmt?)` | TimeSpan 转字符串 |

类型：`now`/`utcNow`/`today`/`parse`/`create` 返回 DateTime 对象；`fromXxx` 返回 TimeSpan 对象；`daysInMonth`/`isLeapYear` 返回数字；`toString`/`toStringTs` 返回字符串。

```javascript
var time = require('std/time');

var dt = time.create(2026, 1, 15, 10, 30);
console.log('date:', time.toString(dt, 'yyyy-MM-dd HH:mm'));
console.log('days in Feb 2026:', time.daysInMonth(2026, 2));
console.log('leap 2024:', time.isLeapYear(2024));

var ts = time.fromHours(2);
console.log('ts:', time.toStringTs(ts));
console.log('now:', time.toString(time.now()));
```

## `require('std/json')`

| 函数 | 说明 |
|------|------|
| `serialize(obj, replacer?, indent?)` | 序列化为 JSON 字符串 |
| `deserialize(json, reviver?)` | 解析 JSON |

类型：`serialize` 返回字符串，`deserialize` 返回 JS 对象/数组/基本类型。

```javascript
var json = require('std/json');
var s = json.serialize({ a: 1, b: [2, 3] }, null, 2);
console.log(s);
var obj = json.deserialize('{"x":10}');
console.log(obj.x);
```

## `require('std/thread')`

桥接 System.Threading.Thread。

| 函数 | 说明 |
|------|------|
| `sleep(ms)` | 阻塞当前线程毫秒数 |
| `sleepTimeout(ts)` | 阻塞当前线程，参数为 TimeSpan |

类型：无返回值。

```javascript
var thread = require('std/thread');
var time = require('std/time');

var sw = time.now();
thread.sleep(100);
var elapsed = time.now() - sw;
console.log('slept ms:', elapsed);
```

## `require('std/guid')`

桥接 System.Guid。Guid 在 JS 侧表示为字符串。

| 函数 | 说明 |
|------|------|
| `newGuid()` | 生成新 Guid |
| `parse(s)` | 解析字符串 |
| `parseExact(s, format)` | 按格式解析 |
| `tryParse(s)` | 解析失败返回 null |
| `empty()` | Guid.Empty |

类型：所有函数返回字符串形式的 Guid。

```javascript
var guid = require('std/guid');
var g = guid.newGuid();
console.log('new:', g);
console.log('parsed:', guid.parse(g));
console.log('empty:', guid.empty());
```

## `require('std/convert')`

桥接 System.Convert。

| 函数 | 说明 |
|------|------|
| `toBase64(bytes)` | 字节数组转 Base64 |
| `fromBase64(str)` | Base64 转字节数组 |
| `toInt32(v)` | 转 int |
| `toInt64(v)` | 转 long |
| `toDouble(v)` | 转 double |
| `toSingle(v)` | 转 float |
| `toDecimal(v)` | 转 decimal |
| `toBoolean(v)` | 转 bool |
| `toByte(v)` | 转 byte |
| `toChar(v)` | 转 char |
| `toString(v)` | 转字符串 |
| `toHexString(bytes)` | 字节数组转十六进制字符串 |
| `fromHexString(str)` | 十六进制字符串转字节数组 |

类型：`toBase64`/`toHexString`/`toString` 返回字符串；`fromBase64`/`fromHexString` 返回数字数组；其余返回对应基本类型。

```javascript
var convert = require('std/convert');
var text = require('std/text');

var bytes = text.getBytes('hi');
console.log('base64:', convert.toBase64(bytes));
console.log('hex:', convert.toHexString(bytes));
console.log('back:', text.getString(convert.fromBase64('aGk=')));
console.log('toInt32:', convert.toInt32('42'));
```

## `require('std/crypto')`

桥接 System.Security.Cryptography。哈希与 HMAC 输入输出均为字节数组，字符串需先经 `text.getBytes` 转换。

哈希摘要：

| 函数 | 说明 |
|------|------|
| `md5(bytes)` | MD5 摘要（16 字节） |
| `sha1(bytes)` | SHA1 摘要（20 字节） |
| `sha256(bytes)` | SHA256 摘要（32 字节） |
| `sha384(bytes)` | SHA384 摘要（48 字节） |
| `sha512(bytes)` | SHA512 摘要（64 字节） |

HMAC（带密钥哈希）：

| 函数 | 说明 |
|------|------|
| `hmacMd5(key, bytes)` | HMAC-MD5 |
| `hmacSha1(key, bytes)` | HMAC-SHA1 |
| `hmacSha256(key, bytes)` | HMAC-SHA256 |
| `hmacSha384(key, bytes)` | HMAC-SHA384 |
| `hmacSha512(key, bytes)` | HMAC-SHA512 |

密码学随机数（RandomNumberGenerator 静态便捷 API）：

| 函数 | 说明 |
|------|------|
| `randomBytes(count)` | 生成指定长度随机字节数组 |
| `randomInt32(from, to)` | [from, to) 范围随机整数 |
| `randomInt64()` | 64 位随机整数 |
| `randomSingle()` | [0,1) 随机 float |
| `randomDouble()` | [0,1) 随机 double |

类型：哈希与 HMAC 返回数字数组；`randomBytes` 返回数字数组；`randomInt32`/`randomInt64` 返回数字；`randomSingle`/`randomDouble` 返回数字。

```javascript
var crypto = require('std/crypto');
var text = require('std/text');
var convert = require('std/convert');

var data = text.getBytes('hello');
console.log('md5 hex:', convert.toHexString(crypto.md5(data)));
console.log('sha256 hex:', convert.toHexString(crypto.sha256(data)));

var key = text.getBytes('secret');
console.log('hmac-sha256:', convert.toHexString(crypto.hmacSha256(key, data)));

console.log('random bytes:', crypto.randomBytes(8));
console.log('random int:', crypto.randomInt32(0, 100));
```

## `require('std/uri')`

桥接 System.Net.WebUtility / System.Uri。

| 函数 | 说明 |
|------|------|
| `urlEncode(str)` | URL 编码 |
| `urlDecode(str)` | URL 解码 |
| `htmlEncode(str)` | HTML 编码 |
| `htmlDecode(str)` | HTML 解码 |
| `escapeDataString(str)` | RFC 3986 数据转义 |
| `unescapeDataString(str)` | RFC 3986 数据反转义 |
| `escapeUriString(str)` | URI 字符串转义 |
| `isWellFormedUriString(str, kind?)` | 是否合规 URI，kind 默认 1（Absolute） |

类型：所有函数返回字符串，`isWellFormedUriString` 返回布尔。

```javascript
var uri = require('std/uri');
console.log(uri.urlEncode('a b&c=1'));
console.log(uri.urlDecode('a%20b%26c%3D1'));
console.log(uri.htmlEncode('<b>'));
console.log(uri.escapeDataString('hello world'));
console.log(uri.isWellFormedUriString('https://example.com'));
```

## `require('std/random')`

桥接 System.Random（使用静态 `Shared` 实例）。

| 函数 | 说明 |
|------|------|
| `next(minOrMax?, max?)` | 整数随机数，无参返回非负整数，单参为上界，双参为范围 [min,max) |
| `nextDouble()` | [0,1) 双精度 |
| `nextInt64()` | 64 位整数 |
| `nextBytes(buffer)` | 用随机字节填充数组 |

类型：返回数字；`nextBytes` 接收数字数组并原地填充。

```javascript
var random = require('std/random');
console.log('next():', random.next());
console.log('next(100):', random.next(100));
console.log('next(50,100):', random.next(50, 100));
console.log('double:', random.nextDouble());
var buf = new Array(4);
random.nextBytes(buf);
console.log('bytes:', buf);
```

## `require('std/diagnostics')`

桥接 System.Diagnostics.Stopwatch 与 System.Diagnostics.Process。

Stopwatch 计时：

| 函数 | 说明 |
|------|------|
| `startNew()` | 新建并启动 |
| `start(sw)` | 启动 |
| `stop(sw)` | 停止 |
| `reset(sw)` | 重置 |
| `restart(sw)` | 重新开始 |
| `elapsedMilliseconds(sw)` | 已过毫秒 |
| `elapsedTicks(sw)` | 已过计时周期 |
| `elapsed(sw)` | 已过 TimeSpan |
| `isRunning(sw)` | 是否运行中 |
| `getTimestamp()` | 当前时间戳 |
| `frequency()` | 计时频率 |
| `isHighResolution()` | 是否高精度计时器 |

Process 进程控制：

| 函数 | 说明 |
|------|------|
| `startProcess(fileName, args?)` | 启动进程，返回 Process 实例 |
| `getCurrentProcess()` | 当前进程 |
| `getProcessById(id)` | 按 PID 获取进程 |
| `getProcesses()` | 所有进程列表 |
| `kill(p, exitCode?)` | 终止进程 |
| `waitForExit(p, ms?)` | 等待退出，可选超时 |
| `getExitCode(p)` | 退出码 |
| `getId(p)` | 进程 ID |
| `getProcessName(p)` | 进程名 |
| `getStartTime(p)` | 启动时间 |
| `getMainWindowTitle(p)` | 主窗口标题 |
| `close(p)` | 关闭进程关联资源 |
| `disposeProcess(p)` | 释放 |

Trace 日志：

| 函数 | 说明 |
|------|------|
| `traceInformation(msg)` | 记录 Information |
| `traceWarning(msg)` | 记录 Warning |
| `traceError(msg)` | 记录 Error |
| `traceWrite(msg)` | Trace.WriteLine |
| `traceFlush()` | 刷新监听器 |

Debug 断言（DEBUG 未定义时仍可调用）：

| 函数 | 说明 |
|------|------|
| `debugWrite(msg)` | Debug.WriteLine |
| `debugAssert(condition, msg?)` | 断言失败时输出 |

类型：`startNew`/`startProcess`/`getCurrentProcess`/`getProcessById` 返回 Stopwatch / Process 对象；`getProcesses` 返回 Process 数组；`elapsed` 返回 TimeSpan；`elapsedMilliseconds`/`elapsedTicks`/`getTimestamp`/`frequency`/`getId`/`getExitCode` 返回数字；`isRunning`/`isHighResolution` 返回布尔。

```javascript
var diag = require('std/diagnostics');

var sw = diag.startNew();
for (var i = 0; i < 1000000; i++) {}
diag.stop(sw);
console.log('elapsed ms:', diag.elapsedMilliseconds(sw));

var cur = diag.getCurrentProcess();
console.log('pid:', diag.getId(cur), 'name:', diag.getProcessName(cur));

diag.traceInformation('一条信息');
diag.traceFlush();
```

## `require('std/net/http')`

桥接 System.Net.Http.HttpClient。异步任务由 host 同步等待结果。

| 函数 | 说明 |
|------|------|
| `client()` | 获取复用的 HttpClient 实例 |
| `getString(url)` | GET 字符串 |
| `getByteArray(url)` | GET 字节数组 |
| `getAsync(url)` | GET 响应 |
| `postString(url, content)` | POST 字符串 |
| `putString(url, content)` | PUT 字符串 |
| `deleteAsync(url)` | DELETE |
| `dispose()` | 释放 HttpClient |

类型：`client` 返回 HttpClient 对象；`getString` 返回字符串；`getByteArray` 返回数字数组；`getAsync`/`postString`/`putString`/`deleteAsync` 返回 HttpResponseMessage 对象。

```javascript
var http = require('std/net/http');
try {
    var body = http.getString('https://httpbin.org/uuid');
    console.log('body:', body);
} catch (e) {
    console.log('请求失败:', e.message);
}
http.dispose();
```

## `require('std/net/dns')`

桥接 System.Net.Dns。异步方法由 host 同步等待。

| 函数 | 说明 |
|------|------|
| `getHostName()` | 本机主机名 |
| `getHostAddresses(host)` | 主机 IP 地址数组 |
| `getHostEntry(host)` | IPHostEntry（含主机名与地址） |
| `getHostEntryAsync(host)` | 异步获取 IPHostEntry |

类型：`getHostName` 返回字符串；`getHostAddresses` 返回 IPAddress 数组；`getHostEntry`/`getHostEntryAsync` 返回 IPHostEntry 对象。

```javascript
var dns = require('std/net/dns');
console.log('hostname:', dns.getHostName());
var addrs = dns.getHostAddresses('localhost');
console.log('addresses:', addrs.length);
```

## `require('std/net/ip')`

桥接 System.Net.IPAddress。注意：IPAddress 对象不要直接 `console.log`（会触发 obsolete 的 Address 属性），用 `ip.toString` 转字符串后再输出。

| 函数 | 说明 |
|------|------|
| `parse(s)` | 解析 IP 字符串 |
| `tryParse(s)` | 解析失败返回 null |
| `any()` | 0.0.0.0 |
| `loopback()` | 127.0.0.1 |
| `broadcast()` | 255.255.255.255 |
| `none()` | 255.255.255.255 |
| `ipv6Any()` | :: |
| `ipv6Loopback()` | ::1 |
| `ipv6None()` | :: |
| `getAddressBytes(ip)` | IP 字节数组 |
| `toString(ip)` | 转字符串 |
| `isLoopback(ip)` | 是否环回地址（静态方法） |
| `getAddressFamily(ip)` | 地址族 |

类型：`parse`/`tryParse`/`any`/`loopback`/`broadcast`/`none`/`ipv6Any`/`ipv6Loopback`/`ipv6None` 返回 IPAddress 对象；`getAddressBytes` 返回数字数组；`toString` 返回字符串；`isLoopback` 返回布尔；`getAddressFamily` 返回 AddressFamily 对象。

```javascript
var ip = require('std/net/ip');
var addr = ip.parse('192.168.1.1');
console.log('addr:', ip.toString(addr));
console.log('bytes:', ip.getAddressBytes(addr));
console.log('isLoopback:', ip.isLoopback(ip.loopback()));
```

## `require('std/io/stream')`

桥接 System.IO.Stream / StreamReader / StreamWriter / MemoryStream。

工厂：

| 函数 | 说明 |
|------|------|
| `memoryStream()` | 新建 MemoryStream |
| `openRead(path)` | 只读打开文件流 |
| `openWrite(path)` | 只写打开文件流 |
| `open(path, mode, access?)` | 按 FileMode/FileAccess 打开 |
| `reader(stream)` | 包装 StreamReader |
| `writer(stream)` | 包装 StreamWriter |
| `readerFromFile(path)` | 从文件直接建 Reader |
| `writerFromFile(path, append?)` | 从文件直接建 Writer |
| `fileMode(name)` | 取 FileMode 枚举值 |
| `fileAccess(name)` | 取 FileAccess 枚举值 |

Stream 操作：

| 函数 | 说明 |
|------|------|
| `read(stream, buffer, offset, count)` | 读取字节，返回读取数 |
| `write(stream, buffer, offset, count)` | 写入字节 |
| `flush(stream)` | 刷新缓冲 |
| `getPosition(stream)` | 当前位置 |
| `setPosition(stream, pos)` | 设置位置 |
| `getLength(stream)` | 流长度 |
| `setLength(stream, len)` | 设置长度 |
| `canRead(stream)` | 是否可读 |
| `canWrite(stream)` | 是否可写 |
| `canSeek(stream)` | 是否可定位 |
| `closeStream(stream)` | 关闭 |
| `disposeStream(stream)` | 释放 |

StreamReader：

| 函数 | 说明 |
|------|------|
| `readLine(r)` | 读一行，EOF 返回 null |
| `readToEnd(r)` | 读到结尾 |
| `closeReader(r)` | 关闭 |

StreamWriter：

| 函数 | 说明 |
|------|------|
| `writeStr(w, s)` | 写字符串 |
| `writeLine(w, s)` | 写一行 |
| `flushWriter(w)` | 刷新 |
| `closeWriter(w)` | 关闭 |

MemoryStream 特有：

| 函数 | 说明 |
|------|------|
| `toArray(ms)` | 写出字节数组 |
| `writeByte(ms, b)` | 写单字节 |
| `readByte(ms)` | 读单字节，EOF 返回 -1 |
| `writeTo(ms, dest, offset, count)` | 写到另一流 |

类型：`memoryStream`/`openRead`/`openWrite`/`open` 返回 Stream 对象；`reader`/`readerFromFile` 返回 StreamReader；`writer`/`writerFromFile` 返回 StreamWriter；`fileMode`/`fileAccess` 返回枚举值；`toArray` 返回数字数组；`read`/`readByte`/`getPosition`/`getLength` 返回数字；`canRead`/`canWrite`/`canSeek` 返回布尔。

```javascript
var stream = require('std/io/stream');

var ms = stream.memoryStream();
stream.writeByte(ms, 65);
stream.writeByte(ms, 66);
stream.setPosition(ms, 0);
console.log('byte:', stream.readByte(ms));
console.log('toArray:', stream.toArray(ms));

var path = require('std/path');
var fs = require('std/fs');
var p = path.join(path.getTempPath(), 'stream_demo.txt');
var w = stream.writerFromFile(p);
stream.writeLine(w, '第一行');
stream.writeLine(w, '第二行');
stream.closeWriter(w);

var r = stream.readerFromFile(p);
var line;
while ((line = stream.readLine(r)) !== null) console.log('line:', line);
stream.closeReader(r);
fs.remove(p);
```

## `require('std/io/compression')`

桥接 System.IO.Compression.ZipFile / ZipArchive。

| 函数 | 说明 |
|------|------|
| `createFromDirectory(src, dst, level?, includeBase?)` | 目录打 Zip |
| `extractToDirectory(zip, dst)` | Zip 解压到目录 |
| `openRead(zip)` | 只读打开 ZipArchive |
| `open(zip, mode)` | 按 ZipArchiveMode 打开 |
| `getEntries(archive)` | 全部条目 |
| `getEntry(archive, name)` | 按名取条目 |
| `createEntry(archive, name)` | 新建条目 |
| `disposeArchive(archive)` | 释放 |
| `getEntryFullName(entry)` | 条目完整路径 |
| `getEntryName(entry)` | 条目文件名 |
| `getEntryLength(entry)` | 未压缩大小 |
| `openEntry(entry)` | 打开条目流 |
| `deleteEntry(entry)` | 删除条目 |
| `archiveMode(name)` | 取 ZipArchiveMode 枚举值 |

类型：`openRead`/`open` 返回 ZipArchive 对象；`getEntries` 返回 ZipArchiveEntry 数组；`getEntry`/`createEntry` 返回 ZipArchiveEntry；`openEntry` 返回 Stream；`getEntryFullName`/`getEntryName` 返回字符串；`getEntryLength` 返回数字；`archiveMode` 返回枚举值。

```javascript
var zip = require('std/io/compression');
var path = require('std/path');
var fs = require('std/fs');

var tmp = path.getTempPath();
var src = path.join(tmp, 'zip_src');
var dst = path.join(tmp, 'demo.zip');
fs.createDirectory(src);
fs.writeAllText(path.join(src, 'a.txt'), 'aaa');
fs.writeAllText(path.join(src, 'b.txt'), 'bbb');

zip.createFromDirectory(src, dst);

var archive = zip.openRead(dst);
var entries = zip.getEntries(archive);
console.log('entries:', entries.length);
for (var i = 0; i < entries.length; i++) {
    console.log(' -', zip.getEntryFullName(entries[i]), zip.getEntryLength(entries[i]));
}
zip.disposeArchive(archive);

var out = path.join(tmp, 'zip_out');
zip.extractToDirectory(dst, out);
fs.deleteDirectory(src, true);
fs.deleteDirectory(out, true);
fs.remove(dst);
```

## `require('std/text_builder')`

桥接 System.Text.StringBuilder。链式方法返回 sb 本身。

| 函数 | 说明 |
|------|------|
| `create(str?)` | 新建 StringBuilder |
| `append(sb, str)` | 追加 |
| `appendLine(sb, str?)` | 追加一行 |
| `appendFormat(sb, format, args)` | 格式化追加 |
| `insert(sb, index, str)` | 插入 |
| `remove(sb, index, length)` | 移除 |
| `replace(sb, old, newStr)` | 替换 |
| `toString(sb, start?, length?)` | 转字符串 |
| `getLength(sb)` | 长度 |
| `setLength(sb, len)` | 设置长度 |
| `getCapacity(sb)` | 容量 |
| `setCapacity(sb, cap)` | 设置容量 |
| `clear(sb)` | 清空 |
| `indexOf(sb, str, start?, count?)` | 查找位置 |

类型：`create` 返回 StringBuilder 对象；`append`/`appendLine`/`appendFormat`/`insert`/`remove`/`replace`/`clear`/`setLength`/`setCapacity` 返回 sb 本身（支持链式）；`toString` 返回字符串；`getLength`/`getCapacity`/`indexOf` 返回数字。

```javascript
var sb = require('std/text_builder');

var b = sb.create();
sb.append(b, 'hello').append(b, ' ').append(b, 'world');
sb.appendFormat(b, ' {0}={1}', ['x', 42]);
console.log(sb.toString(b));
console.log('length:', sb.getLength(b));
sb.clear(b);
console.log('after clear:', JSON.stringify(sb.toString(b)));
```

## `require('std/xml')`

桥接 System.Xml.XmlDocument / XmlNode。XmlDocument 实现了 IEnumerable，但 host 已处理保留 CLR 身份，可直接调用实例方法。

文档操作：

| 函数 | 说明 |
|------|------|
| `create()` | 新建空 XmlDocument |
| `load(path)` | 从文件加载 |
| `parseXml(xml)` | 从字符串加载 |
| `save(doc, path)` | 保存到文件 |
| `getDocumentElement(doc)` | 根元素 |
| `createElement(doc, name)` | 创建元素 |
| `createNode(doc, type, name, ns?)` | 创建节点 |
| `appendChild(doc, node, child)` | 追加子节点 |

XmlNode 通用（也适用于 XmlElement/XmlAttribute 等）：

| 函数 | 说明 |
|------|------|
| `getOuterXml(node)` | 含自身的 XML |
| `getInnerXml(node)` | 子节点 XML |
| `setInnerXml(node, xml)` | 设置子节点 XML |
| `getNodeName(node)` | 节点名 |
| `getNodeValue(node)` | InnerText |
| `setNodeValue(node, val)` | 设置 InnerText |
| `getAttributes(node)` | 属性集合 |
| `getChildNodes(node)` | 子节点列表 |
| `getParentNode(node)` | 父节点 |
| `selectNodes(node, xpath)` | XPath 查询多节点 |
| `selectSingleNode(node, xpath)` | XPath 查询单节点 |

类型：`create`/`load`/`parseXml` 返回 XmlDocument 对象；`createElement`/`createNode`/`getDocumentElement`/`selectSingleNode`/`getParentNode` 返回 XmlNode；`getChildNodes`/`selectNodes` 返回 XmlNodeList；`getAttributes` 返回 XmlAttributeCollection；`getOuterXml`/`getInnerXml`/`getNodeName`/`getNodeValue` 返回字符串。

```javascript
var xml = require('std/xml');

var doc = xml.parseXml('<root><item id="1">a</item><item id="2">b</item></root>');
var root = xml.getDocumentElement(doc);
var items = xml.selectNodes(root, '//item');
console.log('items:', items.Count);
var first = xml.selectSingleNode(root, '//item');
console.log('first text:', xml.getNodeValue(first));
console.log('outer:', xml.getOuterXml(first));
```

## `require('std/math')`

System.Math 扩展，提供 JS Math 没有的函数。变量名 `math` 不要与全局 `Math` 混淆。

| 函数 | 说明 |
|------|------|
| `clamp(v, min, max)` | 限制范围 |
| `sign(v)` | 符号（-1/0/1） |
| `cbrt(v)` | 立方根 |
| `bigMul(a, b)` | 64 位乘积 |
| `log2(v)` | 以 2 为底对数 |
| `log10(v)` | 以 10 为底对数 |
| `ieEEremainder(a, b)` | IEEE 余数 |
| `iLogB(v)` | 以 2 为底整数对数 |
| `scaleB(x, n)` | x * 2^n |
| `copySign(x, y)` | 取 x 绝对值配 y 符号 |
| `maxMagnitude(x, y)` | 绝对值较大者 |
| `minMagnitude(x, y)` | 绝对值较小者 |
| `bitDecrement(x)` | 下一个更小值 |
| `bitIncrement(x)` | 下一个更大值 |
| `truncate(x)` | 截断小数 |
| `reciprocalEstimate(x)` | 倒数估计 |
| `sqrtEstimate(x)` | 平方根估计 |
| `acosh(x)` | 反双曲余弦 |
| `asinh(x)` | 反双曲正弦 |
| `atanh(x)` | 反双曲正切 |
| `sinh(x)` | 双曲正弦 |
| `cosh(x)` | 双曲余弦 |
| `tanh(x)` | 双曲正切 |
| `divRem(a, b)` | 商和余数，返回 {quotient, remainder} |

类型：全部返回数字；`divRem` 返回对象 `{quotient, remainder}`；`bigMul` 返回 64 位整数。

```javascript
var math = require('std/math');
console.log('clamp:', math.clamp(15, 0, 10));
console.log('clamp neg:', math.clamp(-5, 0, 10));
console.log('cbrt:', math.cbrt(27));
console.log('log2:', math.log2(8));
console.log('divRem:', JSON.stringify(math.divRem(17, 5)));
console.log('bigMul:', math.bigMul(123456789, 987654321));
```

## `require('std/bit_converter')`

桥接 System.BitConverter。GetBytes 因 number 与 int/long/double 重载歧义未封装，需要字节时用 `text.getBytes` 或 `convert`。

| 函数 | 说明 |
|------|------|
| `toString(bytes, index?, count?)` | 字节数组转十六进制串（连字符） |
| `toInt32(bytes, index?)` | 字节转 int |
| `toInt64(bytes, index?)` | 字节转 long |
| `toUInt32(bytes, index?)` | 字节转 uint |
| `toUInt64(bytes, index?)` | 字节转 ulong |
| `toSingle(bytes, index?)` | 字节转 float |
| `toDouble(bytes, index?)` | 字节转 double |
| `toChar(bytes, index?)` | 字节转 char |
| `toBoolean(bytes, index?)` | 字节转 bool |
| `doubleToInt64Bits(d)` | double 转 long 位表示 |
| `int64BitsToDouble(l)` | long 转 double |
| `halfToUInt16Bits(h)` | Half 转 ushort 位 |
| `uInt16BitsToHalf(bits)` | ushort 转 Half |
| `isLittleEndian()` | 是否小端 |

类型：`toString` 返回字符串；`toBoolean`/`isLittleEndian` 返回布尔；其余返回数字。

```javascript
var bit = require('std/bit_converter');
var bytes = [1, 0, 0, 0];
console.log('hex:', bit.toString(bytes));
console.log('toInt32:', bit.toInt32(bytes));
console.log('littleEndian:', bit.isLittleEndian());
console.log('bits:', bit.doubleToInt64Bits(1.5));
```

## `require('std/gc')`

桥接 System.GC。

| 函数 | 说明 |
|------|------|
| `collect(generation?, mode?, blocking?, compacting?)` | 触发回收 |
| `waitForPendingFinalizers()` | 等待终结器 |
| `getTotalMemory(force)` | 托管内存总量 |
| `getGeneration(obj)` | 对象所在代 |
| `keepAlive(obj)` | 防止被提前回收 |
| `getAllocatedBytesForCurrentThread()` | 当前线程分配字节数 |
| `maxGeneration()` | 最大代数 |
| `getGCMemoryInfo()` | GC 内存信息 |

类型：`getTotalMemory`/`getGeneration`/`getAllocatedBytesForCurrentThread`/`maxGeneration` 返回数字；`getGCMemoryInfo` 返回 GCMemoryInfo 对象；其余无返回值。

```javascript
var gc = require('std/gc');
gc.collect();
gc.waitForPendingFinalizers();
console.log('total memory:', gc.getTotalMemory(true));
console.log('max generation:', gc.maxGeneration());
console.log('thread allocated:', gc.getAllocatedBytesForCurrentThread());
```

## `require('std/tasks')`

桥接 System.Threading.Tasks.Task。host 对 Task 自动 Wait 拿 Result，故 delay 等表现为同步阻塞。

| 函数 | 说明 |
|------|------|
| `delay(ms)` | 延迟毫秒 |
| `delayWithToken(ms, token)` | 带取消令牌延迟 |
| `run(task)` | Task.Run |
| `wait(task, ms?)` | 等待完成 |
| `waitAll(tasks)` | 等待全部 |
| `waitAny(tasks)` | 等待任一 |
| `whenAll(tasks)` | WhenAll |
| `whenAny(tasks)` | WhenAny |
| `fromResult(value)` | 已完成 Task |
| `isCompleted(task)` | 是否完成 |
| `isFaulted(task)` | 是否出错 |
| `isCanceled(task)` | 是否取消 |
| `getStatus(task)` | TaskStatus |
| `getException(task)` | 异常 |

类型：`delay`/`delayWithToken`/`run`/`whenAll`/`whenAny`/`fromResult` 返回 Task 对象；`wait`/`waitAll`/`waitAny` 返回布尔或数字；`isCompleted`/`isFaulted`/`isCanceled` 返回布尔；`getStatus` 返回 TaskStatus 枚举；`getException` 返回 AggregateException。

```javascript
var tasks = require('std/tasks');
var time = require('std/time');

var sw = time.now();
tasks.delay(200);
console.log('delayed ms:', time.now() - sw);

var t = tasks.fromResult(42);
console.log('completed:', tasks.isCompleted(t));

tasks.whenAll([tasks.delay(50), tasks.delay(80)]);
console.log('all done');
```

## `require('std/globalization')`

桥接 System.Globalization.CultureInfo。

| 函数 | 说明 |
|------|------|
| `getCurrentCulture()` | 当前区域 |
| `getCurrentUICulture()` | 当前 UI 区域 |
| `invariantCulture()` | 固定文化 |
| `installUICulture()` | 系统 UI 文化 |
| `getCulture(name)` | 按名取文化 |
| `createSpecificCulture(name)` | 创建特定文化 |
| `getDisplayName(culture)` | 显示名（本地语言） |
| `getName(culture)` | 名称（如 zh-CN） |
| `getEnglishName(culture)` | 英文名 |
| `getTwoLetterISOLanguageName(culture)` | ISO 双字母语言码 |
| `getNativeName(culture)` | 原生名 |
| `getLCID(culture)` | 文化 ID |

类型：`getCurrentCulture`/`getCurrentUICulture`/`invariantCulture`/`installUICulture`/`getCulture`/`createSpecificCulture` 返回 CultureInfo 对象；`getDisplayName`/`getName`/`getEnglishName`/`getTwoLetterISOLanguageName`/`getNativeName` 返回字符串；`getLCID` 返回数字。

```javascript
var glob = require('std/globalization');
var cur = glob.getCurrentCulture();
console.log('name:', glob.getName(cur));
console.log('english:', glob.getEnglishName(cur));
console.log('native:', glob.getNativeName(cur));
var zh = glob.getCulture('zh-CN');
console.log('zh display:', glob.getDisplayName(zh));
```

## `require('std/app')`

桥接 System.AppContext。

| 函数 | 说明 |
|------|------|
| `getTargetFrameworkName()` | 目标框架名（运行时不支持时返回 null） |
| `baseDirectory()` | 应用基目录 |
| `getData(name)` | 取命名数据 |
| `setSwitch(name, value)` | 设置开关 |
| `tryGetSwitch(name)` | 尝试读取开关 |

类型：`getTargetFrameworkName`/`baseDirectory`/`getData` 返回字符串（失败返回 null）；`tryGetSwitch` 返回对象 `{exists, value}`；其余无返回值。

```javascript
var app = require('std/app');
console.log('base dir:', app.baseDirectory());
console.log('tfm:', app.getTargetFrameworkName());
console.log('local data:', app.getData('LocalApplicationData'));
```

## `require('std/clear')`

彻底清屏模块，清空控制台并重置 scrollback buffer（`console.clear` 只清当前屏）。

| 函数 | 说明 |
|------|------|
| 默认导出 | 调用即清屏 |

类型：默认导出为函数，无返回值。

```javascript
var clear = require('std/clear');
clear();
```

## ASP.NET Core 封装（`std/asp/*`）

直接封装 `Microsoft.AspNetCore.*` 核心程序集，依赖从 `lib/ncl` 目录加载，不依赖任何外部 wrapper。JS 函数作为路由 handler 时自动适配为 `RequestDelegate`（`Func<HttpContext, Task>`），参数与返回值由运行时双向转换。

模块清单：

| 模块 | 说明 |
|------|------|
| `std/asp/host` | WebApplication 主机入口，创建 builder 与 app |
| `std/asp/http` | HttpContext 请求/响应读写辅助 |
| `std/asp/routing` | Minimal API 路由注册 |
| `std/asp/middleware` | 中间件管道 |
| `std/asp/_load` | 程序集加载底层，供其他子模块复用 |

### `require('std/asp/host')`

封装 `Microsoft.AspNetCore.Builder.WebApplication`。

| 函数 | 说明 |
|------|------|
| `createBuilder(args?)` | 创建 `WebApplicationBuilder`，`args` 为可选命令行参数数组，返回 builder 对象 |

builder 对象：

| 成员 | 说明 |
|------|------|
| `services` | `IServiceCollection` 实例（CLR 对象） |
| `configuration` | `IConfiguration` 实例 |
| `environment` | `IWebHostEnvironment` 实例 |
| `build()` | 构建并返回 app 对象 |

app 对象（所有路由/中间件方法返回 app 自身以支持链式调用）：

| 成员 | 说明 |
|------|------|
| `services` / `configuration` / `environment` / `urls` | 运行时实例属性 |
| `run(url?)` | 启动主机监听，`url` 默认 `http://localhost:5000` |
| `use(mw)` | 注册中间件，`mw` 为 `function(next){ return function(ctx){...} }` |
| `useRouting()` | 启用路由中间件 |
| `useStaticFiles(opt?)` | 启用静态文件（依赖 `std/asp/static`，尚未实现，调用会抛异常） |
| `mapGet(p, h)` / `mapPost` / `mapPut` / `mapDelete` / `mapPatch` | 注册对应动词路由 |
| `map(pattern, handler)` | 注册所有动词路由 |
| `mapMethods(pattern, methods, handler)` | 按指定方法数组注册路由 |
| `mapFallback(pattern, handler)` | 兜底路由，`pattern` 省略时用 `{**catchall}` |

类型：`createBuilder` 返回 builder 对象；`build()` 返回 app 对象；`services`/`configuration` 等为 CLR 实例对象，可传给 `dn.callInstance`/`dn.getInstanceProperty`。handler 为 JS 函数，运行时适配为 `RequestDelegate`。

### `require('std/asp/http')`

封装 `Microsoft.AspNetCore.Http.HttpContext` 的请求响应读写。所有函数首参为 `ctx`（HttpContext 实例）。

`request` 对象：

| 函数 | 说明 |
|------|------|
| `method(ctx)` | 请求方法（`GET`/`POST`/...） |
| `path(ctx)` | 请求路径字符串 |
| `query(ctx, key)` | 查询参数首项，无则空串 |
| `header(ctx, key)` | 请求头首项，无则空串 |
| `body(ctx)` | 请求体字符串，用 `ReadToEndAsync` 异步读取（host 自动 Wait 取 Result） |

`response` 对象：

| 函数 | 说明 |
|------|------|
| `status(ctx, code)` | 设置状态码 |
| `type(ctx, contentType)` | 设置 Content-Type |
| `header(ctx, key, value)` | 设置响应头 |
| `text(ctx, str)` | 写入文本（`text/plain`） |
| `json(ctx, obj)` | 写入 JSON（先设 `application/json; charset=utf-8`，再写 `JSON.stringify` 结果） |

| 函数 | 说明 |
|------|------|
| `req(ctx)` | 取原始 `HttpRequest` 实例 |
| `resp(ctx)` | 取原始 `HttpResponse` 实例 |

类型：`method`/`path`/`query`/`header`/`body` 返回字符串；`req`/`resp` 返回 CLR 实例对象。

### `require('std/asp/routing')`

封装 `EndpointRouteBuilderExtensions` 的 Minimal API 注册方法。`app` 为 host 模块 `build()` 返回的 app 对象的内部 `WebApplication` 实例（host 模块已自动转发，一般不直接用此模块）。

| 函数 | 说明 |
|------|------|
| `mapGet(app, pattern, handler)` / `mapPost` / `mapPut` / `mapDelete` / `mapPatch` | 注册对应动词路由 |
| `map(app, pattern, handler)` | 注册所有动词路由 |
| `mapMethods(app, pattern, methods, handler)` | 按方法数组注册 |
| `mapFallback(app, pattern, handler)` | 兜底路由，`pattern` 非字符串时用 `{**catchall}` |

类型：`handler` 为 JS 函数，适配为 `RequestDelegate`；`methods` 为字符串数组；返回 `IEndpointConventionBuilder`。

### `require('std/asp/middleware')`

封装中间件管道。

| 函数 | 说明 |
|------|------|
| `use(app, mw)` | 注册中间件，`mw` 适配为 `Func<RequestDelegate, RequestDelegate>` |
| `invoke(delegate, ctx)` | 调用 `RequestDelegate` 委托（`next(ctx)`） |
| `useRouting(app)` | 启用路由中间件（`EndpointRoutingApplicationBuilderExtensions.UseRouting`） |

类型：`mw` 为 `function(next){ return function(ctx){...} }`，外层函数适配为 `Func<RequestDelegate, RequestDelegate>`，返回的内层函数适配为 `RequestDelegate`；`delegate` 为 `RequestDelegate` CLR 实例。

### `require('std/asp/_load')`

从 `lib/ncl` 加载 ASP.NET Core 核心程序集，供子模块复用。加载清单包含 `Microsoft.AspNetCore`/`Http`/`Routing`/`Hosting`/`Server.Kestrel` 及 `Microsoft.Extensions.*` 等约 30 个程序集。

| 成员 | 说明 |
|------|------|
| `nclDir` | ncl 目录绝对路径 |
| `ensure(name)` | 按文件名加载 `name.dll`，已加载复用，失败返回 null |
| `t(typeName)` | 按全名取类型，找不到抛异常 |

类型：`ensure` 返回程序集包装或 null；`t` 返回 TypeWrapper。

### 完整示例

```javascript
var asp = require('std/asp/host');
var http = require('std/asp/http');

var app = asp.createBuilder().build();

app.mapGet('/hello', function (ctx) {
    http.response.text(ctx, 'hello world');
});

app.mapGet('/status', function (ctx) {
    http.response.json(ctx, {
        ok: true,
        method: http.request.method(ctx),
        path: http.request.path(ctx)
    });
});

app.mapPost('/echo', function (ctx) {
    var body = http.request.body(ctx);
    http.response.json(ctx, { echo: body });
});

app.mapGet('/', function (ctx) {
    http.response.json(ctx, { name: 'Dotnet.JS', version: 1 });
});

app.run('http://localhost:5097');
```

注意事项：
- `WriteAsync` 是 `HttpResponseWritingExtensions` 静态扩展方法，需传 `CancellationToken.None`
- Kestrel 默认禁用同步 IO，请求体用 `ReadToEndAsync` 读取
- `mapFallback` 用 `Map('{**catchall}', handler)` 模拟，避开 Delegate 基类重载的 Body 推断报错
