//配置：端口与仓库根目录
var dn = require('dotnet');
var Path = dn.type('System.IO.Path');

var port = 5098;
var storageRel = dn.callStatic(Path, 'Combine', [__dirname, 'storage']);
var root = dn.callStatic(Path, 'GetFullPath', [storageRel]);
var indexRel = dn.callStatic(Path, 'Combine', [__dirname, 'public/index.html']);
var indexHtml = dn.callStatic(Path, 'GetFullPath', [indexRel]);

module.exports = {
    port: port,
    root: root,
    url: 'http://localhost:' + port,
    indexHtml: indexHtml
};
