# Dotnet.JS

A JavaScript REPL for .NET with direct access to CLR types and methods.

## Features

- **JS REPL**: line editing, syntax highlighting, Tab completion, multi-line input, command history
- **CLR Bridge**: load .NET assemblies, invoke methods/properties, create instances, delegate adaptation
- **Module System**: load JS modules via `require`
- **Extension System**: load C# extension libraries with the convention: `Extension` class + `Initialize(Engine)` entry point
- **Standard Library**: `fs`, `path`, `convert`, `crypto`, `xml`, `net`, `asp`, `logging`, and more
- **ASP.NET Core Integration**: build `WebApplication`, register routes and middleware entirely from the JavaScript side
