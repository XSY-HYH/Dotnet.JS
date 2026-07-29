// lib/std/asp/routing.js
// Minimal API 路由注册，handler 为 JS 函数，自动适配为 RequestDelegate
var dn = require('dotnet');
var load = require('./_load');

var EndpointExtensions = load.t('Microsoft.AspNetCore.Builder.EndpointRouteBuilderExtensions');

function mapVerb(method, app, pattern, handler) {
    return dn.callStatic(EndpointExtensions, method, [app, pattern, handler]);
}

module.exports = {
    mapGet: function (app, pattern, handler) { return mapVerb('MapGet', app, pattern, handler); },
    mapPost: function (app, pattern, handler) { return mapVerb('MapPost', app, pattern, handler); },
    mapPut: function (app, pattern, handler) { return mapVerb('MapPut', app, pattern, handler); },
    mapDelete: function (app, pattern, handler) { return mapVerb('MapDelete', app, pattern, handler); },
    mapPatch: function (app, pattern, handler) { return mapVerb('MapPatch', app, pattern, handler); },
    map: function (app, pattern, handler) { return mapVerb('Map', app, pattern, handler); },
    mapMethods: function (app, pattern, methods, handler) {
        return dn.callStatic(EndpointExtensions, 'MapMethods', [app, pattern, methods, handler]);
    },
    // MapFallback 只有 Delegate 基类重载，用 Map catch-all 模拟兜底
    mapFallback: function (app, pattern, handler) {
        var p = (typeof pattern === 'string') ? pattern : '{**catchall}';
        return dn.callStatic(EndpointExtensions, 'Map', [app, p, handler]);
    }
};
