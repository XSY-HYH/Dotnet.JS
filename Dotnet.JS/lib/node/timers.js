const dn = require('../dotnet.js');
const Task = dn.type('System.Threading.Tasks.Task');

// setImmediate - 在事件循环下一轮执行
function setImmediate(callback, ...args) {
    return Task.Run(() => {
        callback(...args);
    });
}

function clearImmediate(handle) {
    // .NET Task 无法取消，但可以忽略
}

// process.nextTick - 在当前操作完成后立即执行
function nextTick(callback, ...args) {
    // 使用 Task.Yield 模拟微任务
    Task.Run(async () => {
        await Task.Yield();
        callback(...args);
    });
}

module.exports = {
    setImmediate,
    clearImmediate,
    nextTick
};