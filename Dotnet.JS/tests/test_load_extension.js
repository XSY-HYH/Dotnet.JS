// 端到端验证 loadExtension：加载 dll + 调 Initialize 注册全局 API
var dn = require('dotnet');

var dllPath = 'D:/Programming/C#/JintRepl/Dotnet.JS.Tests.Extension/bin/Release/net10.0/Dotnet.JS.Tests.Extension.dll';
var asm = loadExtension(dllPath);
console.log('asm.name: ' + asm.name);
console.log('extGreeting: ' + extGreeting);
console.log('extAdd(3,4): ' + extAdd(3, 4));
