// clear.js
var dn = require('dotnet');
var Console = dn.type('System.Console');

// 直接导出函数
module.exports = function clear() {
    console.clear();
    dn.callStatic(Console, 'Write', '\x1b[3J');
    dn.callStatic(Console, 'Write', '\x1b[H');
};