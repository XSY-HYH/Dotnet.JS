// 导出所有 Node API
const process = require('./process.js');
const Buffer = require('./buffer.js');
const timers = require('./timers.js');

// 挂载到全局
global.process = process;
global.Buffer = Buffer;
global.setImmediate = timers.setImmediate;
global.clearImmediate = timers.clearImmediate;
global.__dirname = __dirname;
global.__filename = __filename;
global.global = global;

// 导出 Node 兼容层
module.exports = {
    process,
    Buffer,
    setImmediate: timers.setImmediate,
    clearImmediate: timers.clearImmediate,
    nextTick: timers.nextTick
};