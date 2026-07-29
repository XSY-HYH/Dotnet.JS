# Dotnet.JS.Web

基于 Dotnet.JS 运行时与 ASP.NET Core 封装（std/asp）实现的简易文件仓库服务，验证 Dotnet.JS 编写 web 后台的可行性。

## 运行

```
dotnet run --project d:/Programming/C#/JintRepl/Dotnet.JS -- d:/Programming/C#/JintRepl/Dotnet.JS.Web/app.js
```

浏览器打开 http://localhost:5098

仓库根目录为 `Dotnet.JS.Web/storage`，启动时自动创建。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 前端页面 |
| GET | `/api/list?path=` | 列目录，返回 `{ok, data:{path, dirs:[{name,lastWrite}], files:[{name,size,lastWrite}]}}` |
| POST | `/api/upload` | body `{path, base64}`，base64 解码写入文件 |
| GET | `/api/download?path=` | 下载文件 |
| DELETE | `/api/delete?path=` | 删除文件或目录（目录递归） |
| POST | `/api/mkdir` | body `{path}`，创建目录 |
| POST | `/api/move` | body `{from, to}`，移动或重命名 |

path 均相对仓库根目录，后端做沙箱校验防 `../` 越界。

## 结构

```
app.js              入口
config.js           端口与路径配置
services/storage.js 存储服务（沙箱+文件操作+下载字节流）
routes/files.js     API 路由
public/index.html   前端单页
storage/            仓库根目录（运行时生成）
```
