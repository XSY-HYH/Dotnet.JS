//文件操作路由，每个 handler 签名 function(ctx)，异常统一 500 + json
var fs = require('std/fs');
var http = require('std/asp/http');
var convert = require('std/convert');
var config = require('../config');
var storage = require('../services/storage');

function fail(ctx, e) {
    http.response.status(ctx, 500);
    http.response.json(ctx, { ok: false, error: String((e && e.message) || e) });
}

//返回前端页面
function serveIndex(ctx) {
    try {
        var html = fs.readAllText(config.indexHtml);
        http.response.type(ctx, 'text/html; charset=utf-8');
        http.response.text(ctx, html);
    } catch (e) {
        fail(ctx, e);
    }
}

//列目录 GET /api/list?path=
function list(ctx) {
    try {
        var p = http.request.query(ctx, 'path');
        http.response.json(ctx, { ok: true, data: storage.list(p) });
    } catch (e) {
        fail(ctx, e);
    }
}

//上传 POST /api/upload，body 为 {path, base64}
function upload(ctx) {
    try {
        var body = http.request.body(ctx);
        var obj = JSON.parse(body);
        if (!obj || !obj.path || obj.base64 === undefined) {
            throw new Error('需要 path 和 base64 字段');
        }
        var bytes = convert.fromBase64(obj.base64);
        storage.save(obj.path, bytes);
        http.response.json(ctx, { ok: true });
    } catch (e) {
        fail(ctx, e);
    }
}

//下载 GET /api/download?path=
function download(ctx) {
    try {
        var p = http.request.query(ctx, 'path');
        var bytes = storage.readBytes(p);
        storage.writeToResponse(ctx, bytes, storage.contentTypeOf(p), storage.fileName(p));
    } catch (e) {
        fail(ctx, e);
    }
}

//删除 DELETE /api/delete?path=
function del(ctx) {
    try {
        var p = http.request.query(ctx, 'path');
        storage.del(p);
        http.response.json(ctx, { ok: true });
    } catch (e) {
        fail(ctx, e);
    }
}

//新建目录 POST /api/mkdir，body 为 {path}
function mkdir(ctx) {
    try {
        var obj = JSON.parse(http.request.body(ctx));
        storage.mkdir(obj.path);
        http.response.json(ctx, { ok: true });
    } catch (e) {
        fail(ctx, e);
    }
}

//移动或重命名 POST /api/move，body 为 {from, to}
function move(ctx) {
    try {
        var obj = JSON.parse(http.request.body(ctx));
        storage.move(obj.from, obj.to);
        http.response.json(ctx, { ok: true });
    } catch (e) {
        fail(ctx, e);
    }
}

module.exports = {
    serveIndex: serveIndex,
    list: list,
    upload: upload,
    download: download,
    del: del,
    mkdir: mkdir,
    move: move
};
