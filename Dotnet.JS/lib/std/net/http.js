// lib/std/net/http.js
// HTTP 客户端，桥接 System.Net.Http.HttpClient
var dn = require('dotnet');
var HttpClient = dn.type('System.Net.Http.HttpClient');
var StringContent = dn.type('System.Net.Http.StringContent');

var _client = null;

function client() {
    if (!_client) _client = dn.createInstance(HttpClient, []);
    return _client;
}

// 同步等待 Task<string> 结果（JsValueConverter 对 Task 自动 Wait 拿 Result）
function getString(url) {
    return dn.callInstance(HttpClient, client(), 'GetStringAsync', [url]);
}

function getByteArray(url) {
    return dn.callInstance(HttpClient, client(), 'GetByteArrayAsync', [url]);
}

function getAsync(url) {
    return dn.callInstance(HttpClient, client(), 'GetAsync', [url]);
}

function postString(url, content) {
    var httpContent = dn.createInstance(StringContent, [content]);
    return dn.callInstance(HttpClient, client(), 'PostAsync', [url, httpContent]);
}

function putString(url, content) {
    var httpContent = dn.createInstance(StringContent, [content]);
    return dn.callInstance(HttpClient, client(), 'PutAsync', [url, httpContent]);
}

function deleteAsync(url) {
    return dn.callInstance(HttpClient, client(), 'DeleteAsync', [url]);
}

function dispose() {
    if (_client) {
        dn.callInstance(HttpClient, _client, 'Dispose', []);
        _client = null;
    }
}

module.exports = {
    client: client,
    getString: getString,
    getByteArray: getByteArray,
    getAsync: getAsync,
    postString: postString,
    putString: putString,
    deleteAsync: deleteAsync,
    dispose: dispose
};
