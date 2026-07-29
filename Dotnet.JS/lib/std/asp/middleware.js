// lib/std/asp/middleware.js
// 中间件管道，middleware 为 function(next){ return function(ctx){...} }
var dn = require('dotnet');
var load = require('./_load');

var WebApplication = load.t('Microsoft.AspNetCore.Builder.WebApplication');
var RequestDelegate = load.t('Microsoft.AspNetCore.Http.RequestDelegate');
var EndpointRoutingExt = load.t('Microsoft.AspNetCore.Builder.EndpointRoutingApplicationBuilderExtensions');

// 注册中间件，app.Use(Func<RequestDelegate, RequestDelegate>)
function use(app, middleware) {
    return dn.callInstance(WebApplication, app, 'Use', [middleware]);
}

// 调用 RequestDelegate 委托（next(ctx)）
function invoke(delegate, ctx) {
    return dn.callInstance(RequestDelegate, delegate, 'Invoke', [ctx]);
}

// 启用路由中间件
function useRouting(app) {
    return dn.callStatic(EndpointRoutingExt, 'UseRouting', [app]);
}

module.exports = {
    use: use,
    invoke: invoke,
    useRouting: useRouting
};
