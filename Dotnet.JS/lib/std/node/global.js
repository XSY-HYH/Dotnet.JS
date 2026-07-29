const dn = require('../dotnet.js');
const Path = dn.type('System.IO.Path');
const Assembly = dn.type('System.Reflection.Assembly');

// 在模块加载时动态设置
function getDirname() {
    // 从调用栈获取当前文件路径
    const caller = getCallerFile();
    return Path.GetDirectoryName(caller);
}

// 获取调用者文件（模拟 Node 的栈解析）
function getCallerFile() {
    // 简版：使用 Assembly.GetEntryAssembly().Location
    return Assembly.GetEntryAssembly().Location;
}

// 设置全局变量
global.__dirname = getDirname();
global.__filename = Assembly.GetEntryAssembly().Location;
global.global = global;