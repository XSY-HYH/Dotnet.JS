//Dotnet.JS.Web 文件仓库服务入口
var asp = require('std/asp/host');
var fs = require('std/fs');
var config = require('./config');
var files = require('./routes/files');

//初始化仓库根目录
console.log('DEBUG root=' + config.root + ' url=' + config.url);
if (!fs.directoryExists(config.root)) fs.createDirectory(config.root);

var app = asp.createBuilder().build();

app.mapGet('/', files.serveIndex);
app.mapGet('/api/list', files.list);
app.mapPost('/api/upload', files.upload);
app.mapGet('/api/download', files.download);
app.mapDelete('/api/delete', files.del);
app.mapPost('/api/mkdir', files.mkdir);
app.mapPost('/api/move', files.move);

console.log('file repo running on ' + config.url);
app.run(config.url);
