Here's the updated README with that additional note at the end:

---

# Dotnet.JS

A JavaScript REPL for .NET with direct access to CLR types and methods.

❤ This project is currently for fun — I haven't fixed all the command-line rough edges yet, but I'll keep updating it actively! 🥰

## Features

- **JS REPL**: line editing, syntax highlighting, Tab completion, multi-line input, command history
- **CLR Bridge**: load .NET assemblies, invoke methods/properties, create instances, delegate adaptation
- **Module System**: load JS modules via `require`
- **Extension System**: load C# extension libraries with the convention: `Extension` class + `Initialize(Engine)` entry point
- **Standard Library**: `fs`, `path`, `convert`, `crypto`, `xml`, `net`, `asp`, `logging`, and more
- **ASP.NET Core Integration**: build `WebApplication`, register routes and middleware entirely from the JavaScript side

---

> 📝 **Note**: The primary language of this project is actually **C#**. GitHub shows JavaScript as the main language because the standard library is also distributed alongside the code, which skews the stats. That's not a true reflection — this is a C# project at heart.
