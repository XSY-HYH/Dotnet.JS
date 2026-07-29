var asp = require('std/asp/host');
var http = require('std/asp/http');

try {
    console.log('1. modules loaded');

    var builder = asp.createBuilder();
    console.log('2. builder created');

    var app = builder.build();
    console.log('3. app built');

    app.mapGet('/hello', function (ctx) {
        http.response.text(ctx, 'hello world');
    });
    console.log('4. mapGet registered');

    app.mapPost('/echo', function (ctx) {
        var body = http.request.body(ctx);
        http.response.json(ctx, { echo: body });
    });
    console.log('5. mapPost registered');

    app.mapGet('/', function (ctx) {
        http.response.json(ctx, { name: 'Dotnet.JS', version: 1 });
    });
    console.log('6. root route registered');

    console.log('ALL OK');
} catch (e) {
    console.log('FAIL:', e.message);
    console.log(e.stack || '');
}
