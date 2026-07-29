// lib/std/node/index.js
const process = require('./process.js');
const Buffer = require('./buffer.js');
const timers = require('./timers.js');

// ✅ 兼容 Jint 的全局对象获取方式
var root = (typeof global !== 'undefined') ? global :
           (typeof window !== 'undefined') ? window :
           (typeof this !== 'undefined') ? this :
           {};

// 挂载到全局
if (root) {
    root.process = process;
    root.Buffer = Buffer;
    root.setImmediate = timers.setImmediate;
    root.clearImmediate = timers.clearImmediate;
    root.nextTick = timers.nextTick;
}

// 导出
module.exports = {
    process: process,
    Buffer: Buffer,
    setImmediate: timers.setImmediate,
    clearImmediate: timers.clearImmediate,
    nextTick: timers.nextTick
};