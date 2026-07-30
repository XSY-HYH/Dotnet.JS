Here's the updated README with a new chapter explaining the project structure:

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

## Project Structure

This repository contains three related projects:

- **Dotnet.JS** — The main project. A JavaScript REPL for .NET that provides a bridge between JS and the CLR, allowing you to load assemblies, invoke methods, and interact with .NET types directly from a JavaScript environment.

- **Dotnet.TS** — An experimental TypeScript language extension for the REPL. This is a work-in-progress add-on that aims to bring TypeScript syntax support to the Dotnet.JS ecosystem.

- **Dotnet.JS.Web** — A test project specifically designed to validate and exercise the ASP.NET Core integration capabilities of the standard library. 

---

> 📝 **Note**: The primary language of this project is actually **C#**. GitHub shows JavaScript as the main language because the standard library is also distributed alongside the code, which skews the stats. That's not a true reflection — this is a C# project at heart.
