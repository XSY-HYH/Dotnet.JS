// lib/std/asp/host.js
// WebApplication 主机，封装 Minimal API 入口
var dn = require('dotnet');
var load = require('./_load');
var routing = require('./routing');
var middleware = require('./middleware');

var WebApplication = load.t('Microsoft.AspNetCore.Builder.WebApplication');
var WebApplicationBuilder = load.t('Microsoft.AspNetCore.Builder.WebApplicationBuilder');

// 创建 WebApplicationBuilder，可选传入命令行参数数组
function createBuilder(args) {
    var builder;
    if (args && args.length) {
        builder = dn.callStatic(WebApplication, 'CreateBuilder', [args]);
    } else {
        builder = dn.callStatic(WebApplication, 'CreateBuilder', []);
    }
    return wrapBuilder(builder);
}

function wrapBuilder(builder) {
    return {
        _target: builder,
        get services() { return dn.getInstanceProperty(WebApplicationBuilder, builder, 'Services'); },
        get configuration() { return dn.getInstanceProperty(WebApplicationBuilder, builder, 'Configuration'); },
        get environment() { return dn.getInstanceProperty(WebApplicationBuilder, builder, 'Environment'); },
        build: function () { return wrapApp(dn.callInstance(WebApplicationBuilder, builder, 'Build', [])); }
    };
}

function wrapApp(app) {
    var obj = {
        _target: app,
        get services() { return dn.getInstanceProperty(WebApplication, app, 'Services'); },
        get configuration() { return dn.getInstanceProperty(WebApplication, app, 'Configuration'); },
        get environment() { return dn.getInstanceProperty(WebApplication, app, 'Environment'); },
        get urls() { return dn.getInstanceProperty(WebApplication, app, 'Urls'); },

        run: function (url) {
            dn.callInstance(WebApplication, app, 'Run', [url || 'http://localhost:5000']);
        },

        use: function (mw) { middleware.use(app, mw); return obj; },
        useRouting: function () { middleware.useRouting(app); return obj; },
        useStaticFiles: function (opt) { require('./static').useStaticFiles(app, opt); return obj; },

        mapGet: function (p, h) { routing.mapGet(app, p, h); return obj; },
        mapPost: function (p, h) { routing.mapPost(app, p, h); return obj; },
        mapPut: function (p, h) { routing.mapPut(app, p, h); return obj; },
        mapDelete: function (p, h) { routing.mapDelete(app, p, h); return obj; },
        mapPatch: function (p, h) { routing.mapPatch(app, p, h); return obj; },
        map: function (p, h) { routing.map(app, p, h); return obj; },
        mapMethods: function (p, ms, h) { routing.mapMethods(app, p, ms, h); return obj; },
        mapFallback: function (p, h) {
            if (typeof p === 'function') { routing.mapFallback(app, '{**catchall}', p); }
            else { routing.mapFallback(app, p, h); }
            return obj;
        }
    };
    return obj;
}

module.exports = {
    createBuilder: createBuilder
};
