# Dotnet.JS.Web 文件仓库服务实现方案

## Context

用户想验证用 Dotnet.JS 写 web 后台的可行性，并落地一个简易文件仓库服务。Dotnet.JS 的 asp 标准库（std/asp/host+http+routing）已验证能跑起 ASP.NET Core 服务器（asp_server.js 四路由全通），fs 标准库提供完整文件操作。本方案组合两者，在仓库根目录 `Dotnet.JS.Web/` 下建一个带 HTML 页面的文件仓库服务，既作为可行性示例，也作为 Dotnet.JS 的实战用例。

用户决策：带简单 HTML 页面；仓库根目录用 `Dotnet.JS.Web/storage`（自动创建）。

## 目录结构

```
Dotnet.JS.Web/
  app.js              入口：加载配置、创建 asp app、挂载静态页、注册 API 路由、启动
  config.js           配置：端口 5098、仓库根目录 storage 绝对路径
  services/
    storage.js        存储服务：路径安全沙箱 + 文件操作（list/save/download/delete/mkdir/move/info）
  routes/
    files.js          文件操作路由：挂 /api/* 端点
  public/
    index.html        前端单页：列表/上传/下载/删除/新建目录/重命名
  storage/            仓库根目录（启动时自动创建，gitignore）
  README.md           说明：运行方式与 API
  .gitignore          屏蔽 storage/
```

## 依赖的现有标准库（复用，不改动）

- `std/asp/host`：createBuilder().build() → app，app.mapGet/mapPost/mapDelete/mapMethods/run
- `std/asp/http`：http.request.{method,path,query,header,body}、http.response.{status,type,header,text,json}、http.req/resp 取原始 HttpRequest/HttpResponse
- `std/fs`：readAllBytes/writeAllBytes/exists/remove/move/getFiles/getDirectories/createDirectory/deleteDirectory/getLastWriteTime
- `std/path`：combine/getDirectoryName/getFullPath（路径拼接）
- `std/dotnet`：type/callStatic/callInstance/getInstanceProperty/createInstance（补充 fs 没有的能力）
- `std/convert`：fromBase64（上传解码）

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 返回 index.html |
| GET | `/api/list?path=` | 列目录，返回 `{path, dirs:[{name}], files:[{name,size,lastWrite}]}`，path 默认根目录 |
| POST | `/api/upload` | body: `{path, base64}`，base64 解码后 writeAllBytes |
| GET | `/api/download?path=` | 下载文件，写字节流到 Body，设 Content-Disposition |
| DELETE | `/api/delete?path=` | 删除文件或目录（目录递归） |
| POST | `/api/mkdir` | body: `{path}`，创建目录 |
| POST | `/api/move` | body: `{from, to}`，移动/重命名 |

所有 path 参数相对仓库根目录，services/storage.js 做沙箱校验。

## 关键技术点

### 1. 路径安全沙箱（services/storage.js）
```
var full = path.combine(root, relPath);
full = dn.callStatic(Path, 'GetFullPath', [full]);          // 规范化
var rootFull = dn.callStatic(Path, 'GetFullPath', [root]);
if (!full.startsWith(rootFull)) throw new Error('越界');
```
所有 storage 方法入口调 `resolve(relPath)` 统一校验。

### 2. 文件下载（写字节流，绕过 response 只有 text/json 的限制）
```
var bytes = fs.readAllBytes(fullPath);                      // 返回 JsArray
var body = dn.getInstanceProperty(HttpResponse, resp, 'Body');
dn.callInstance(Stream, body, 'WriteAsync', [bytes, 0, bytes.length, ctNone]);
```
需在 storage.js 顶部取 `Stream = dn.type('System.IO.Stream')`、`HttpResponse = load.t('Microsoft.AspNetCore.Http.HttpResponse')`、`ctNone` 同 asp/http.js 取法。下载前设 Content-Type（用 FileExtensionContentTypeProvider 或简单按扩展名映射）和 Content-Disposition: attachment。

### 3. 文件上传（二进制安全）
前端用 FileReader.readAsDataURL 转 base64，POST `{path, base64}`。后端 `convert.fromBase64(base64)` 得 JsArray，`fs.writeAllBytes(fullPath, bytes)`。避开 http.request.body 读字符串损坏二进制的问题。

### 4. 文件大小（fs 无直接 API，用 FileInfo 补）
```
var fi = dn.createInstance(FileInfo, [fullPath]);
var size = dn.getInstanceProperty(FileInfo, fi, 'Length');
```

### 5. 静态页返回
index.html 用 fs.readAllText 读，http.response.type(ctx, 'text/html; charset=utf-8') + http.response.text(ctx, html)。GET '/' 路由处理。

## 前端页面（public/index.html）

单文件 HTML，原生 JS（无框架）：
- 顶部工具栏：当前路径面包屑、新建目录按钮、上传按钮（input file）
- 表格：名称、大小、修改时间、操作（下载/删除/重命名）
- 目录项可点击进入
- 上传：FileReader.readAsDataURL → fetch POST /api/upload
- 下载：window.location = /api/download?path=xxx
- 删除/重命名：fetch 对应端点后刷新列表

## 入口 app.js 结构

```
var asp = require('std/asp/host');
var http = require('std/asp/http');
var fs = require('std/fs');
var config = require('./config');
var files = require('./routes/files');

// 初始化仓库根目录
if (!fs.directoryExists(config.root)) fs.createDirectory(config.root);

var app = asp.createBuilder().build();

app.mapGet('/', files.serveIndex);
app.mapGet('/api/list', files.list);
app.mapPost('/api/upload', files.upload);
app.mapGet('/api/download', files.download);
app.mapDelete('/api/delete', files.del);
app.mapPost('/api/mkdir', files.mkdir);
app.mapPost('/api/move', files.move);

console.log('file repo on ' + config.url);
app.run(config.url);
```

routes/files.js 的每个 handler 签名 `function(ctx)`，内部调 services/storage.js，用 http.response.json 返回结果，异常 try-catch 后 status 500 + json 错误信息。

## 验证方法

1. 启动服务：
   `dotnet run --project d:/Programming/C#/JintRepl/Dotnet.JS -- d:/Programming/C#/JintRepl/Dotnet.JS.Web/app.js`
2. 浏览器打开 `http://localhost:5098`，应见文件管理页面
3. API 端到端测试（curl）：
   - `curl http://localhost:5098/api/list` → 空列表
   - 新建目录、上传文件、下载、删除，逐项验证
   - 路径越界测试：`curl "http://localhost:5098/api/list?path=../../etc"` → 500 越界错误
4. 二进制文件上传/下载一致性：上传图片后下载，比对字节
