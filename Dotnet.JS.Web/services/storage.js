//存储服务：路径沙箱校验 + 文件操作 + 下载字节流写入
var dn = require('dotnet');
var fs = require('std/fs');
var load = require('std/asp/_load');
var http = require('std/asp/http');
var config = require('../config');

var Path = dn.type('System.IO.Path');
var FileInfo = dn.type('System.IO.FileInfo');
var DateTime = dn.type('System.DateTime');
var HttpResponse = load.t('Microsoft.AspNetCore.Http.HttpResponse');
var Stream = dn.type('System.IO.Stream');
var CancellationToken = dn.type('System.Threading.CancellationToken');
var ctNone = dn.getProperty(CancellationToken, 'None');

var root = config.root;
var rootFull = dn.callStatic(Path, 'GetFullPath', [root]);

//扩展名到 Content-Type 映射
var extTypes = {
    '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.bmp': 'image/bmp', '.ico': 'image/x-icon',
    '.pdf': 'application/pdf', '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg'
};

//相对路径解析为绝对路径并做沙箱校验，防 ../ 越界
function resolve(relPath) {
    relPath = relPath || '';
    var combined = dn.callStatic(Path, 'Combine', [root, relPath]);
    var full = dn.callStatic(Path, 'GetFullPath', [combined]);
    if (full !== rootFull && full.indexOf(rootFull) !== 0) {
        throw new Error('路径越界: ' + relPath);
    }
    return full;
}

//DateTime 转字符串，避免 ObjectWrapper 直接 JSON 序列化异常
function formatTime(dt) {
    if (!dt) return '';
    try {
        return dn.callInstance(DateTime, dt, 'ToString', ['yyyy-MM-dd HH:mm:ss']);
    } catch (e) {
        return String(dt);
    }
}

//列目录，返回 dirs 与 files 数组
function list(relPath) {
    var full = resolve(relPath);
    console.log('DEBUG list relPath=' + relPath + ' full=' + full + ' root=' + root);
    if (!fs.directoryExists(full)) throw new Error('目录不存在: ' + relPath);
    var dirNames = fs.getDirectories(full) || [];
    var fileNames = fs.getFiles(full) || [];
    var dirs = [];
    for (var i = 0; i < dirNames.length; i++) {
        dirs.push({
            name: dn.callStatic(Path, 'GetFileName', [dirNames[i]]),
            lastWrite: formatTime(fs.getLastWriteTime(dirNames[i]))
        });
    }
    var files = [];
    for (var j = 0; j < fileNames.length; j++) {
        var fi = dn.createInstance(FileInfo, [fileNames[j]]);
        files.push({
            name: dn.callStatic(Path, 'GetFileName', [fileNames[j]]),
            size: dn.getInstanceProperty(FileInfo, fi, 'Length'),
            lastWrite: formatTime(fs.getLastWriteTime(fileNames[j]))
        });
    }
    return { path: relPath || '', dirs: dirs, files: files };
}

//写字节到相对路径，父目录不存在自动创建
function save(relPath, bytes) {
    var full = resolve(relPath);
    var parent = dn.callStatic(Path, 'GetDirectoryName', [full]);
    if (parent && !fs.directoryExists(parent)) fs.createDirectory(parent);
    fs.writeAllBytes(full, bytes);
}

//读文件字节
function readBytes(relPath) {
    var full = resolve(relPath);
    if (!fs.exists(full)) throw new Error('文件不存在: ' + relPath);
    return fs.readAllBytes(full);
}

//删除文件或目录，目录递归
function del(relPath) {
    var full = resolve(relPath);
    if (fs.directoryExists(full)) fs.deleteDirectory(full, true);
    else if (fs.exists(full)) fs.remove(full);
    else throw new Error('不存在: ' + relPath);
}

//创建目录
function mkdir(relPath) {
    fs.createDirectory(resolve(relPath));
}

//移动或重命名
function move(fromRel, toRel) {
    fs.move(resolve(fromRel), resolve(toRel));
}

//取文件名
function fileName(relPath) {
    return dn.callStatic(Path, 'GetFileName', [resolve(relPath)]);
}

//按扩展名取 Content-Type
function contentTypeOf(relPath) {
    var ext = dn.callStatic(Path, 'GetExtension', [resolve(relPath)]);
    ext = ext ? ext.toLowerCase() : '';
    return extTypes[ext] || 'application/octet-stream';
}

//写字节流到 HttpResponse.Body，绕过 response 只有 text/json 的限制
function writeToResponse(ctx, bytes, contentType, downloadName) {
    if (contentType) http.response.type(ctx, contentType);
    if (downloadName) {
        http.response.header(ctx, 'Content-Disposition',
            'attachment; filename="' + downloadName + '"');
    }
    var resp = http.resp(ctx);
    var body = dn.getInstanceProperty(HttpResponse, resp, 'Body');
    dn.callInstance(Stream, body, 'WriteAsync', [bytes, 0, bytes.length, ctNone]);
}

module.exports = {
    root: root,
    resolve: resolve,
    list: list,
    save: save,
    readBytes: readBytes,
    del: del,
    mkdir: mkdir,
    move: move,
    fileName: fileName,
    contentTypeOf: contentTypeOf,
    writeToResponse: writeToResponse
};
