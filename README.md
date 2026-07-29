# Dotnet.JS

.NET 上的 JavaScript REPL，可直接调用 CLR 类型与方法。

## 功能

- JS REPL：行编辑、语法高亮、Tab 补全、多行输入、历史记录
- CLR 桥接：加载 .NET 程序集，调用方法/属性，创建实例，委托适配
- 模块系统：require 加载 JS 模块
- 扩展系统：加载 C# 扩展库，约定 Extension 类 + Initialize(Engine) 入口
- 标准库：fs、path、convert、crypto、xml、net、asp、logging 等
- ASP.NET Core 封装：JS 侧构建 WebApplication、注册路由、中间件
