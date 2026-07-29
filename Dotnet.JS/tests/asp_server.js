var asp = require('std/asp/host');
var http = require('std/asp/http');

var app = asp.createBuilder().build();

app.mapGet('/hello', function (ctx) {
    http.response.text(ctx, 'hello world');
});

app.mapGet('/status', function (ctx) {
    http.response.json(ctx, { ok: true, method: http.request.method(ctx), path: http.request.path(ctx) });
});

app.mapPost('/echo', function (ctx) {
    var body = http.request.body(ctx);
    http.response.json(ctx, { echo: body });
});

app.mapGet('/', function (ctx) {
    http.response.json(ctx, { name: 'Dotnet.JS', version: 1 });
});

console.log('server starting on http://localhost:5097');
app.run('http://localhost:5097');
