// lib/std/node/process.js
const dn = require('../dotnet.js');

const Environment = dn.type('System.Environment');
const Directory = dn.type('System.IO.Directory');

// ✅ 兼容 Jint 的全局对象
var root = (typeof global !== 'undefined') ? global :
           (typeof window !== 'undefined') ? window :
           (typeof this !== 'undefined') ? this :
           {};

// 确保 process 对象已存在
if (!root.process) {
    root.process = {};
}

var process = {
    argv: (function() {
        try {
            var args = dn.callStatic(Environment, 'GetCommandLineArgs', []);
            return args ? Array.from(args) : ['dotnet', 'script.js'];
        } catch (e) {
            return ['dotnet', 'script.js'];
        }
    })(),
    
    env: new Proxy({}, {
        get: function(target, name) {
            try {
                var value = dn.callStatic(Environment, 'GetEnvironmentVariable', [name]);
                return value !== null && value !== undefined ? value : undefined;
            } catch (e) {
                return undefined;
            }
        },
        set: function(target, name, value) {
            try {
                dn.callStatic(Environment, 'SetEnvironmentVariable', [name, String(value)]);
                return true;
            } catch (e) {
                return false;
            }
        }
    }),
    
    cwd: function() {
        try {
            return dn.callStatic(Directory, 'GetCurrentDirectory', []);
        } catch (e) {
            return '.';
        }
    },
    
    // ✅ 添加 exit 方法
    exit: function(code) {
        try {
            dn.callStatic(Environment, 'Exit', [code !== undefined ? code : 0]);
        } catch (e) {
            // Jint 可能不支持 Environment.Exit，用异常模拟
            throw new Error('Process exit: ' + (code !== undefined ? code : 0));
        }
    },
    
    platform: (function() {
        try {
            var os = dn.getProperty(Environment, 'OSVersion');
            if (os) {
                var platform = dn.callStatic(os, 'get_Platform', []);
                if (platform === 4) return 'win32';
                if (platform === 6) return 'linux';
                if (platform === 5) return 'darwin';
            }
            return 'win32';
        } catch (e) {
            return 'win32';
        }
    })(),
    
    arch: (function() {
        try {
            var is64 = dn.getProperty(Environment, 'Is64BitProcess');
            return is64 ? 'x64' : 'x32';
        } catch (e) {
            return 'x64';
        }
    })(),
    
    pid: (function() {
        try {
            return dn.getProperty(Environment, 'ProcessId') || 0;
        } catch (e) {
            return 0;
        }
    })(),
    
    uptime: function() {
        try {
            var ticks = dn.getProperty(Environment, 'TickCount64');
            return ticks ? ticks / 1000 : 0;
        } catch (e) {
            return 0;
        }
    },
    
    memoryUsage: function() {
        try {
            var workingSet = dn.getProperty(Environment, 'WorkingSet');
            return {
                rss: workingSet || 0,
                heapTotal: 0,
                heapUsed: 0,
                external: 0,
                arrayBuffers: 0
            };
        } catch (e) {
            return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
        }
    },
    
    version: 'v20.10.0',
    versions: { node: '20.10.0' },
    title: 'Dotnet.JS',
    stdin: { readable: true },
    stdout: { writable: true },
    stderr: { writable: true }
};

// 将 process 挂载到全局
root.process = process;

module.exports = process;