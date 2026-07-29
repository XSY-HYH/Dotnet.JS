// lib/std/diagnostics.js
// 诊断工具，桥接 System.Diagnostics.Stopwatch / Process / Trace / Debug
var dn = require('dotnet');
var Stopwatch = dn.type('System.Diagnostics.Stopwatch');
var Process = dn.type('System.Diagnostics.Process');
var Trace = dn.type('System.Diagnostics.Trace');
var Debug = dn.type('System.Diagnostics.Debug');

// Stopwatch
function startNew() { return dn.callStatic(Stopwatch, 'StartNew', []); }
function start(sw) { dn.callInstance(Stopwatch, sw, 'Start', []); }
function stop(sw) { dn.callInstance(Stopwatch, sw, 'Stop', []); }
function reset(sw) { dn.callInstance(Stopwatch, sw, 'Reset', []); }
function restart(sw) { dn.callInstance(Stopwatch, sw, 'Restart', []); }
function elapsedMilliseconds(sw) { return dn.getInstanceProperty(Stopwatch, sw, 'ElapsedMilliseconds'); }
function elapsedTicks(sw) { return dn.getInstanceProperty(Stopwatch, sw, 'ElapsedTicks'); }
function elapsed(sw) { return dn.getInstanceProperty(Stopwatch, sw, 'Elapsed'); }
function isRunning(sw) { return dn.getInstanceProperty(Stopwatch, sw, 'IsRunning'); }
function getTimestamp() { return dn.callStatic(Stopwatch, 'GetTimestamp', []); }
function frequency() { return dn.getProperty(Stopwatch, 'Frequency'); }
function isHighResolution() { return dn.getProperty(Stopwatch, 'IsHighResolution'); }

// Process
function startProcess(fileName, args) {
    return args !== undefined
        ? dn.callStatic(Process, 'Start', [fileName, args])
        : dn.callStatic(Process, 'Start', [fileName]);
}
function getCurrentProcess() { return dn.callStatic(Process, 'GetCurrentProcess', []); }
function getProcessById(id) { return dn.callStatic(Process, 'GetProcessById', [id]); }
function getProcesses() { return dn.callStatic(Process, 'GetProcesses', []); }
function kill(p, exitCode) {
    if (exitCode !== undefined) dn.callInstance(Process, p, 'Kill', [exitCode]);
    else dn.callInstance(Process, p, 'Kill', []);
}
function waitForExit(p, ms) {
    if (ms !== undefined) dn.callInstance(Process, p, 'WaitForExit', [ms]);
    else dn.callInstance(Process, p, 'WaitForExit', []);
}
function getExitCode(p) { return dn.getInstanceProperty(Process, p, 'ExitCode'); }
function getId(p) { return dn.getInstanceProperty(Process, p, 'Id'); }
function getProcessName(p) { return dn.getInstanceProperty(Process, p, 'ProcessName'); }
function getStartTime(p) { return dn.getInstanceProperty(Process, p, 'StartTime'); }
function getMainWindowTitle(p) { return dn.getInstanceProperty(Process, p, 'MainWindowTitle'); }
function close(p) { dn.callInstance(Process, p, 'Close', []); }
function disposeProcess(p) { dn.callInstance(Process, p, 'Dispose', []); }

// Trace
function traceInformation(msg) { dn.callStatic(Trace, 'TraceInformation', [msg]); }
function traceError(msg) { dn.callStatic(Trace, 'TraceError', [msg]); }
function traceWarning(msg) { dn.callStatic(Trace, 'TraceWarning', [msg]); }
function traceWrite(msg) { dn.callStatic(Trace, 'WriteLine', [msg]); }
function traceFlush() { dn.callStatic(Trace, 'Flush', []); }

// Debug（DEBUG 未定义时方法体被 Conditional 移除，但反射 Invoke 仍执行）
function debugWrite(msg) { dn.callStatic(Debug, 'WriteLine', [msg]); }
function debugAssert(condition, msg) {
    if (msg !== undefined) dn.callStatic(Debug, 'Assert', [condition === true, msg]);
    else dn.callStatic(Debug, 'Assert', [condition === true]);
}

module.exports = {
    startNew: startNew,
    start: start,
    stop: stop,
    reset: reset,
    restart: restart,
    elapsedMilliseconds: elapsedMilliseconds,
    elapsedTicks: elapsedTicks,
    elapsed: elapsed,
    isRunning: isRunning,
    getTimestamp: getTimestamp,
    frequency: frequency,
    isHighResolution: isHighResolution,
    startProcess: startProcess,
    getCurrentProcess: getCurrentProcess,
    getProcessById: getProcessById,
    getProcesses: getProcesses,
    kill: kill,
    waitForExit: waitForExit,
    getExitCode: getExitCode,
    getId: getId,
    getProcessName: getProcessName,
    getStartTime: getStartTime,
    getMainWindowTitle: getMainWindowTitle,
    close: close,
    disposeProcess: disposeProcess,
    traceInformation: traceInformation,
    traceError: traceError,
    traceWarning: traceWarning,
    traceWrite: traceWrite,
    traceFlush: traceFlush,
    debugWrite: debugWrite,
    debugAssert: debugAssert
};
