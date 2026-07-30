// bootstrap.js
var dn = require('dotnet');
dn.load('System.Xml.XmlDocument')
dn.load('System.Security.Cryptography')
dn.load('System.Net.NameResolution')
dn.load('System.Diagnostics.TraceSource')
dn.load('System.Diagnostics.Process')
dn.load('System.IO.Compression.ZipFile')
dn.load('System.IO.Compression')
globalThis.dn = require('std/dotnet');
globalThis.console = require('std/console');
globalThis.process = require('std/process');
globalThis.fs = require('std/fs');
globalThis.path = require('std/path');
globalThis.os = require('std/os');
globalThis.text = require('std/text');
globalThis.text_builder = require('std/text_builder');
globalThis.json = require('std/json');
globalThis.xml = require('std/xml');
globalThis.time = require('std/time');
globalThis.thread = require('std/thread');
globalThis.tasks = require('std/tasks');
globalThis.math = require('std/math');
globalThis.convert = require('std/convert');
globalThis.bit_converter = require('std/bit_converter');
globalThis.guid = require('std/guid');
globalThis.random = require('std/random');
globalThis.crypto = require('std/crypto');
globalThis.http = require('std/net/http');
globalThis.dns = require('std/net/dns');
globalThis.ip = require('std/net/ip');
globalThis.ws = require('std/net/ws');
globalThis.sql = require('std/sql');
globalThis.uri = require('std/uri');
globalThis.diagnostics = require('std/diagnostics');
globalThis.gc = require('std/gc');
globalThis.globalization = require('std/globalization');
globalThis.app = require('std/app');
globalThis.stream = require('std/io/stream');
globalThis.compression = require('std/io/compression');
globalThis.clear = require('std/clear');
globalThis.cls = globalThis.clear;
globalThis.exit = function(){require('std/os').exit(0);};
globalThis.native = (function(){try{var os=require('std/os');return require(os.osVersion().indexOf('Windows')!==-1?'native/windows':'native/linux');}catch(e){return null;}})();
globalThis.logs = require('std/logging/logger.js');
// ASP.NET Core 封装主入口
globalThis.asp = require('std/asp/host');
// Node.js 兼容层，仅挂 Buffer 与 timers，process 保留 std/process 避免破坏 argv 语义
globalThis.Buffer = require('std/node/buffer');
var _nodeTimers = require('std/node/timers');
globalThis.setImmediate = _nodeTimers.setImmediate;
globalThis.clearImmediate = _nodeTimers.clearImmediate;
globalThis.nextTick = _nodeTimers.nextTick;
// 扩展库加载，约定 dll 有公开类 Extension 带无参构造和 Initialize(Engine)
globalThis.loadExtension = function(p){ return __load_extension(p); };
// 扫描 lib/extension/ 下 dll 自动加载，单个失败不阻断其余
(function(){
    var extDir = path.combine(path.combine(app.baseDirectory(), 'lib'), 'extension');
    if (!fs.directoryExists(extDir)) return;
    var dlls = fs.getFiles(extDir, '*.dll');
    for (var i = 0; i < dlls.length; i++) {
        try { loadExtension(dlls[i]); }
        catch (e) { console.log('extension load failed: ' + dlls[i] + ' - ' + e.message); }
    }
})();
