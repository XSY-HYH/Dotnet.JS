// lib/std/gc.js
// 垃圾回收控制，桥接 System.GC
var dn = require('dotnet');
var GC = dn.type('System.GC');

function collect(generation, mode, blocking, compacting) {
    if (compacting !== undefined) dn.callStatic(GC, 'Collect', [generation, mode, blocking, compacting]);
    else if (blocking !== undefined) dn.callStatic(GC, 'Collect', [generation, mode, blocking]);
    else if (mode !== undefined) dn.callStatic(GC, 'Collect', [generation, mode]);
    else if (generation !== undefined) dn.callStatic(GC, 'Collect', [generation]);
    else dn.callStatic(GC, 'Collect', []);
}
function waitForPendingFinalizers() { dn.callStatic(GC, 'WaitForPendingFinalizers', []); }
function getTotalMemory(force) { return dn.callStatic(GC, 'GetTotalMemory', [force === true]); }
function getGeneration(obj) { return dn.callStatic(GC, 'GetGeneration', [obj]); }
function keepAlive(obj) { dn.callStatic(GC, 'KeepAlive', [obj]); }
function getAllocatedBytesForCurrentThread() { return dn.callStatic(GC, 'GetAllocatedBytesForCurrentThread', []); }
function maxGeneration() { return dn.getProperty(GC, 'MaxGeneration'); }
function getGCMemoryInfo() { return dn.callStatic(GC, 'GetGcMemoryInfo', []); }

module.exports = {
    collect: collect,
    waitForPendingFinalizers: waitForPendingFinalizers,
    getTotalMemory: getTotalMemory,
    getGeneration: getGeneration,
    keepAlive: keepAlive,
    getAllocatedBytesForCurrentThread: getAllocatedBytesForCurrentThread,
    maxGeneration: maxGeneration,
    getGCMemoryInfo: getGCMemoryInfo
};
