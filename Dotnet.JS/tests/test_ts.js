// 验证 Dotnet.TS 扩展：loadExtension + tsCompile
var dn = require('dotnet');
var dllPath = 'D:/Programming/C#/JintRepl/Dotnet.TS/bin/Release/net10.0/Dotnet.TS.dll';
loadExtension(dllPath);
console.log('tsCompile: ' + typeof tsCompile);
console.log('tsrepl: ' + typeof tsrepl);

var ts = 'let x: number = 42; const s: string = "hello"; interface P { a: number } function add(p: P): number { return p.a + x } console.log(add({a:8}), s)';
console.log('--- TS source ---');
console.log(ts);
var js = tsCompile(ts);
console.log('--- compiled JS ---');
console.log(js);
console.log('--- run ---');
eval(js);
