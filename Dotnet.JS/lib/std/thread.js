// lib/std/thread.js
// 线程控制，桥接 System.Threading.Thread
var dn = require('dotnet');
var Thread = dn.type('System.Threading.Thread');

function sleep(ms) { dn.callStatic(Thread, 'Sleep', [ms]); }
function sleepTimeout(ts) { dn.callStatic(Thread, 'Sleep', [ts]); }

module.exports = {
    sleep: sleep,
    sleepTimeout: sleepTimeout
};
