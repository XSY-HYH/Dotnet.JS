// lib/std/node/timers.js
const dn = require('../dotnet.js');

// ✅ 兼容 Jint
var root = (typeof global !== 'undefined') ? global :
           (typeof window !== 'undefined') ? window :
           (typeof this !== 'undefined') ? this :
           {};

var _nextTickCallbacks = [];
var _immediateCallbacks = [];

// process.nextTick
function nextTick(callback) {
    _nextTickCallbacks.push(callback);
    // Jint 中可以用 setTimeout 模拟
    if (typeof setTimeout !== 'undefined') {
        setTimeout(function() {
            while (_nextTickCallbacks.length > 0) {
                var cb = _nextTickCallbacks.shift();
                cb();
            }
        }, 0);
    }
}

// setImmediate
function setImmediate(callback) {
    _immediateCallbacks.push(callback);
    if (typeof setTimeout !== 'undefined') {
        setTimeout(function() {
            while (_immediateCallbacks.length > 0) {
                var cb = _immediateCallbacks.shift();
                cb();
            }
        }, 0);
    }
    // 返回一个模拟的句柄
    return { _id: _immediateCallbacks.length - 1 };
}

function clearImmediate(handle) {
    // 简化实现
}

// 挂载到全局
if (!root.setImmediate) {
    root.setImmediate = setImmediate;
}
if (!root.clearImmediate) {
    root.clearImmediate = clearImmediate;
}
if (!root.nextTick) {
    root.nextTick = nextTick;
}

module.exports = {
    setImmediate: setImmediate,
    clearImmediate: clearImmediate,
    nextTick: nextTick
};