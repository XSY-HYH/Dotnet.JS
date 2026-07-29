// 验证 lib/extension/ 自动加载：不手动 loadExtension，tsCompile 应已可用
console.log('tsCompile: ' + typeof tsCompile);
console.log('tsrepl: ' + typeof tsrepl);
var js = tsCompile('let x: number = 42; const s: string = "auto"; console.log(x, s)');
console.log('--- compiled ---');
console.log(js);
eval(js);
