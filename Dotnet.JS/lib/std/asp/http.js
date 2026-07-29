// lib/std/asp/http.js
// HttpContext 请求响应读写辅助
var dn = require('dotnet');
var load = require('./_load');

var HttpContext = load.t('Microsoft.AspNetCore.Http.HttpContext');
var HttpRequest = load.t('Microsoft.AspNetCore.Http.HttpRequest');
var HttpResponse = load.t('Microsoft.AspNetCore.Http.HttpResponse');
var IQueryCollection = load.t('Microsoft.AspNetCore.Http.IQueryCollection');
var IHeaderDictionary = load.t('Microsoft.AspNetCore.Http.IHeaderDictionary');
var PathString = load.t('Microsoft.AspNetCore.Http.PathString');
var StringValues = load.t('Microsoft.Extensions.Primitives.StringValues');
var StreamReader = load.t('System.IO.StreamReader');
var HttpResponseWritingExt = load.t('Microsoft.AspNetCore.Http.HttpResponseWritingExtensions');
var CancellationToken = load.t('System.Threading.CancellationToken');
var ctNone = dn.getProperty(CancellationToken, 'None');

function req(ctx) {
    return dn.getInstanceProperty(HttpContext, ctx, 'Request');
}
function resp(ctx) {
    return dn.getInstanceProperty(HttpContext, ctx, 'Response');
}

// StringValues 经 ToJsValue 转字符串数组，取首项或空串
function firstVal(v) {
    if (Array.isArray(v)) return v.length > 0 ? v[0] : '';
    return v === null || v === undefined ? '' : String(v);
}

// string 转 StringValues
function toSv(s) {
    return dn.createInstance(StringValues, [s]);
}

var request = {
    method: function (ctx) { return dn.getInstanceProperty(HttpRequest, req(ctx), 'Method'); },
    path: function (ctx) {
        var p = dn.getInstanceProperty(HttpRequest, req(ctx), 'Path');
        return p ? dn.getInstanceProperty(PathString, p, 'Value') : '';
    },
    query: function (ctx, key) {
        var q = dn.getInstanceProperty(HttpRequest, req(ctx), 'Query');
        if (!q) return '';
        return firstVal(dn.callInstance(IQueryCollection, q, 'get_Item', [key]));
    },
    header: function (ctx, key) {
        var h = dn.getInstanceProperty(HttpRequest, req(ctx), 'Headers');
        if (!h) return '';
        return firstVal(dn.callInstance(IHeaderDictionary, h, 'get_Item', [key]));
    },
    body: function (ctx) {
        var stream = dn.getInstanceProperty(HttpRequest, req(ctx), 'Body');
        if (!stream) return '';
        var reader = dn.createInstance(StreamReader, [stream]);
        // Kestrel 默认禁用同步IO，用 ReadToEndAsync，Task 由 host 自动 Wait 取 Result
        return dn.callInstance(StreamReader, reader, 'ReadToEndAsync', []);
    }
};

var response = {
    status: function (ctx, code) {
        dn.callInstance(HttpResponse, resp(ctx), 'set_StatusCode', [code]);
    },
    type: function (ctx, contentType) {
        dn.callInstance(HttpResponse, resp(ctx), 'set_ContentType', [contentType]);
    },
    header: function (ctx, key, value) {
        var h = dn.getInstanceProperty(HttpResponse, resp(ctx), 'Headers');
        if (h) dn.callInstance(IHeaderDictionary, h, 'set_Item', [key, toSv(value)]);
    },
    text: function (ctx, str) {
        dn.callStatic(HttpResponseWritingExt, 'WriteAsync', [resp(ctx), str, ctNone]);
    },
    json: function (ctx, obj) {
        dn.callInstance(HttpResponse, resp(ctx), 'set_ContentType', ['application/json; charset=utf-8']);
        dn.callStatic(HttpResponseWritingExt, 'WriteAsync', [resp(ctx), JSON.stringify(obj), ctNone]);
    }
};

module.exports = {
    request: request,
    response: response,
    req: req,
    resp: resp
};
