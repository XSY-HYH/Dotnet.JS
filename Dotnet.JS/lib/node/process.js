// 完全用 JavaScript 手工实现 Node 的 process
const dn = require('../dotnet.js');
const Environment = dn.type('System.Environment');
const Directory = dn.type('System.IO.Directory');
const Process = dn.type('System.Diagnostics.Process');
const AppContext = dn.type('System.AppContext');

// 创建 process 对象
const process = {
    // 命令行参数
    argv: (function() {
        const args = Environment.GetCommandLineArgs();
        // 模拟 Node：第一个是 node.exe，第二个是脚本路径
        return Array.from(args);
    })(),
    
    // 环境变量（返回对象，但实际是字典）
    env: new Proxy({}, {
        get: function(target, name) {
            return Environment.GetEnvironmentVariable(name) || undefined;
        },
        set: function(target, name, value) {
            Environment.SetEnvironmentVariable(name, value);
            return true;
        }
    }),
    
    // 工作目录
    cwd: function() {
        return Directory.GetCurrentDirectory();
    },
    
    // 退出
    exit: function(code) {
        Environment.Exit(code || 0);
    },
    
    // 平台
    platform: (function() {
        const os = Environment.OSVersion.Platform;
        // 映射到 Node 的 platform 字符串
        return os === 4 ? 'win32' : 'linux';
    })(),
    
    // 进程 ID
    pid: Environment.ProcessId,
    
    // Node 版本（硬编码或从环境读取）
    version: 'v20.10.0',
    
    // 内存使用（模拟）
    memoryUsage: function() {
        return {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0
        };
    },
    
    // 事件监听（简化版）
    _events: {},
    on: function(event, callback) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
    },
    emit: function(event) {
        const callbacks = this._events[event] || [];
        callbacks.forEach(cb => cb());
    }
};

module.exports = process;