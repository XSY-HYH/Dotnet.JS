// lib/std/tasks.js
// 任务调度，桥接 System.Threading.Tasks.Task
// Task 在 JsValueConverter 中自动 Wait 拿 Result，故 delay/run 表现为同步阻塞
var dn = require('dotnet');
var Task = dn.type('System.Threading.Tasks.Task');

function delay(ms) { return dn.callStatic(Task, 'Delay', [ms]); }
function delayWithToken(ms, token) { return dn.callStatic(Task, 'Delay', [ms, token]); }
function run(task) { return dn.callStatic(Task, 'Run', [task]); }
function wait(task, ms) {
    if (ms !== undefined) return dn.callInstance(Task, task, 'Wait', [ms]);
    return dn.callInstance(Task, task, 'Wait', []);
}
function waitAll(tasks) { return dn.callStatic(Task, 'WaitAll', [tasks]); }
function waitAny(tasks) { return dn.callStatic(Task, 'WaitAny', [tasks]); }
function whenAll(tasks) { return dn.callStatic(Task, 'WhenAll', [tasks]); }
function whenAny(tasks) { return dn.callStatic(Task, 'WhenAny', [tasks]); }
function fromResult(value) { return dn.callStatic(Task, 'FromResult', [value]); }
function isCompleted(task) { return dn.getInstanceProperty(Task, task, 'IsCompleted'); }
function isFaulted(task) { return dn.getInstanceProperty(Task, task, 'IsFaulted'); }
function isCanceled(task) { return dn.getInstanceProperty(Task, task, 'IsCanceled'); }
function getStatus(task) { return dn.getInstanceProperty(Task, task, 'Status'); }
function getException(task) { return dn.getInstanceProperty(Task, task, 'Exception'); }

module.exports = {
    delay: delay,
    delayWithToken: delayWithToken,
    run: run,
    wait: wait,
    waitAll: waitAll,
    waitAny: waitAny,
    whenAll: whenAll,
    whenAny: whenAny,
    fromResult: fromResult,
    isCompleted: isCompleted,
    isFaulted: isFaulted,
    isCanceled: isCanceled,
    getStatus: getStatus,
    getException: getException
};
