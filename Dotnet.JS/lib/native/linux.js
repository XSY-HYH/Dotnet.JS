// lib/native/linux.js
// Linux Native API 封装
// 基于 __native_* 底层桥接
// 支持：libc 系统调用、GTK 对话框、D-Bus 通知、文件操作等

var dn = require('std/dotnet');

// ============================================================
// 底层句柄缓存
// ============================================================

var _libc = null;
var _libdl = null;
var _libgtk = null;
var _libnotify = null;

function _getLibc() {
    if (!_libc) {
        // Linux 下 libc 通常是 libc.so.6 或 libc.so
        try {
            _libc = __native_load('libc.so.6');
        } catch (e) {
            try {
                _libc = __native_load('libc.so');
            } catch (e2) {
                try {
                    _libc = __native_load('libc.so.6');
                } catch (e3) {}
            }
        }
    }
    return _libc;
}

function _getLibdl() {
    if (!_libdl) {
        try {
            _libdl = __native_load('libdl.so.2');
        } catch (e) {
            try {
                _libdl = __native_load('libdl.so');
            } catch (e2) {}
        }
    }
    return _libdl;
}

function _getLibGtk() {
    if (!_libgtk) {
        try {
            _libgtk = __native_load('libgtk-3.so.0');
        } catch (e) {
            try {
                _libgtk = __native_load('libgtk-3.so');
            } catch (e2) {}
        }
    }
    return _libgtk;
}

function _getLibNotify() {
    if (!_libnotify) {
        try {
            _libnotify = __native_load('libnotify.so.4');
        } catch (e) {
            try {
                _libnotify = __native_load('libnotify.so');
            } catch (e2) {}
        }
    }
    return _libnotify;
}

// 缓存函数指针
var _procCache = {};

function _getProc(handle, name) {
    var key = handle.toString() + ':' + name;
    if (!_procCache[key]) {
        _procCache[key] = __native_get_proc(handle, name);
    }
    return _procCache[key];
}

// ============================================================
// 工具函数
// ============================================================

function _getCurrentDirectory() {
    try {
        var Directory = dn.type('System.IO.Directory');
        return Directory.callStatic('GetCurrentDirectory', []);
    } catch (e) {
        try {
            var AppContext = dn.type('System.AppContext');
            return AppContext.callStatic('get_BaseDirectory', []);
        } catch (e2) {
            return '.';
        }
    }
}

// ============================================================
// 1. libc 基础函数
// ============================================================

/**
 * 获取当前进程 ID
 */
function getPid() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'getpid');
    return __native_call(proc, [], [], 'int');
}

/**
 * 获取当前用户 ID
 */
function getUid() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'getuid');
    return __native_call(proc, [], [], 'int');
}

/**
 * 获取当前有效用户 ID
 */
function getEuid() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'geteuid');
    return __native_call(proc, [], [], 'int');
}

/**
 * 获取当前组 ID
 */
function getGid() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'getgid');
    return __native_call(proc, [], [], 'int');
}

/**
 * 获取主机名
 */
function getHostname() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'gethostname');
    // 分配 256 字节缓冲区（需要 __native_alloc）
    // 如果 __native_alloc 还没实现，用 .NET 兜底
    try {
        var Environment = dn.type('System.Environment');
        return Environment.callStatic('get_MachineName', []);
    } catch (e) {
        return 'localhost';
    }
}

/**
 * 获取系统启动时间（uptime）
 * @returns {number} 系统运行秒数
 */
function getUptime() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'sysinfo');
    // sysinfo 结构体比较复杂，用 .NET 兜底
    try {
        var Environment = dn.type('System.Environment');
        var tickCount = Environment.callStatic('get_TickCount', []);
        return tickCount / 1000;
    } catch (e) {
        return 0;
    }
}

/**
 * 获取当前工作目录
 */
function getCwd() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'getcwd');
    // 需要缓冲区，用 .NET 兜底
    return _getCurrentDirectory();
}

/**
 * 设置环境变量
 */
function setEnv(name, value, overwrite) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'setenv');
    if (overwrite === undefined) overwrite = 1;
    return __native_call(proc, ['string','string','int'], [name, value, overwrite], 'int');
}

/**
 * 删除环境变量
 */
function unsetEnv(name) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'unsetenv');
    return __native_call(proc, ['string'], [name], 'int');
}

/**
 * 获取环境变量
 */
function getEnv(name) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'getenv');
    var result = __native_call(proc, ['string'], [name], 'string');
    return result;
}

// ============================================================
// 2. 文件操作（POSIX）
// ============================================================

/**
 * 检查文件是否存在（用 access 系统调用）
 */
function fileExists(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'access');
    var F_OK = 0;
    return __native_call(proc, ['string','int'], [path, F_OK], 'int') === 0;
}

/**
 * 检查文件是否可读
 */
function fileReadable(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'access');
    var R_OK = 4;
    return __native_call(proc, ['string','int'], [path, R_OK], 'int') === 0;
}

/**
 * 检查文件是否可写
 */
function fileWritable(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'access');
    var W_OK = 2;
    return __native_call(proc, ['string','int'], [path, W_OK], 'int') === 0;
}

/**
 * 检查文件是否可执行
 */
function fileExecutable(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'access');
    var X_OK = 1;
    return __native_call(proc, ['string','int'], [path, X_OK], 'int') === 0;
}

/**
 * 删除文件（unlink）
 */
function unlink(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'unlink');
    return __native_call(proc, ['string'], [path], 'int') === 0;
}

/**
 * 删除目录（rmdir）
 */
function rmdir(path) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'rmdir');
    return __native_call(proc, ['string'], [path], 'int') === 0;
}

// ============================================================
// 3. 进程控制
// ============================================================

/**
 * 执行命令（system 调用）
 * @returns {number} 命令退出码
 */
function system(cmd) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'system');
    return __native_call(proc, ['string'], [cmd], 'int');
}

/**
 * 创建子进程（fork）
 * @returns {number} 子进程 PID，-1 表示失败
 */
function fork() {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'fork');
    return __native_call(proc, [], [], 'int');
}

/**
 * 执行程序（execvp）
 */
function execvp(file, argv) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'execvp');
    // argv 需要是 C 风格的指针数组，__native_call 不一定支持
    // 用 .NET Process.Start 替代
    try {
        var Process = dn.type('System.Diagnostics.Process');
        var psi = dn.type('System.Diagnostics.ProcessStartInfo');
        var startInfo = psi.createInstance([file]);
        startInfo.setProperty('UseShellExecute', false);
        var args = argv ? argv.slice(1).join(' ') : '';
        startInfo.setProperty('Arguments', args);
        return Process.callStatic('Start', [startInfo]) !== null;
    } catch (e) {
        return false;
    }
}

/**
 * 等待进程退出（waitpid）
 */
function waitpid(pid) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'waitpid');
    var status = 0;
    var options = 0;
    return __native_call(proc, ['int','intptr','int'], [pid, status, options], 'int');
}

/**
 * 退出进程（exit）
 */
function exit(code) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'exit');
    __native_call(proc, ['int'], [code], 'void');
}

// ============================================================
// 4. 信号处理
// ============================================================

/**
 * 发送信号（kill）
 */
function kill(pid, signal) {
    var hLibc = _getLibc();
    var proc = _getProc(hLibc, 'kill');
    return __native_call(proc, ['int','int'], [pid, signal], 'int');
}

/**
 * 信号常量
 */
var SIGTERM = 15;
var SIGKILL = 9;
var SIGINT = 2;
var SIGHUP = 1;

// ============================================================
// 5. 动态库加载
// ============================================================

/**
 * 动态加载共享库（dlopen）
 */
function dlopen(filename, flags) {
    var hLibdl = _getLibdl();
    var proc = _getProc(hLibdl, 'dlopen');
    if (flags === undefined) flags = 1; // RTLD_LAZY
    return __native_call(proc, ['string','int'], [filename, flags], 'intptr');
}

/**
 * 从动态库获取符号（dlsym）
 */
function dlsym(handle, symbol) {
    var hLibdl = _getLibdl();
    var proc = _getProc(hLibdl, 'dlsym');
    return __native_call(proc, ['intptr','string'], [handle, symbol], 'intptr');
}

/**
 * 关闭动态库（dlclose）
 */
function dlclose(handle) {
    var hLibdl = _getLibdl();
    var proc = _getProc(hLibdl, 'dlclose');
    return __native_call(proc, ['intptr'], [handle], 'int') === 0;
}

/**
 * 获取 dl 错误信息（dlerror）
 */
function dlerror() {
    var hLibdl = _getLibdl();
    var proc = _getProc(hLibdl, 'dlerror');
    return __native_call(proc, [], [], 'string');
}

// ============================================================
// 6. GTK 对话框（图形界面）
// ============================================================

/**
 * 显示 GTK 消息对话框
 * @param {string} text - 消息内容
 * @param {string} title - 标题
 * @param {string} type - 类型: 'info', 'warning', 'error', 'question'
 * @returns {number} 按钮返回值
 */
function gtkMessageBox(text, title, type) {
    title = title || '提示';
    type = type || 'info';
    
    // 用 .NET 的 MessageBox 替代（在 Linux 下通过 GTK# 或 Zenity）
    // 或者直接用 Zenity 命令行
    var zenity = '/usr/bin/zenity';
    var iconMap = {
        'info': '--info',
        'warning': '--warning',
        'error': '--error',
        'question': '--question'
    };
    var icon = iconMap[type] || '--info';
    
    var cmd = zenity + ' ' + icon + ' --text="' + text + '" --title="' + title + '"';
    if (type === 'question') {
        cmd += ' --ok-label="是" --cancel-label="否"';
    }
    
    var result = system(cmd);
    // Zenity: 0=OK/Yes, 1=Cancel/No
    if (type === 'question') {
        return result === 0 ? 6 : 7; // 模拟 Windows 的 IDYES=6, IDNO=7
    }
    return result;
}

/**
 * 简单信息框
 */
function info(text, title) {
    return gtkMessageBox(text, title || '信息', 'info');
}

/**
 * 警告框
 */
function warn(text, title) {
    return gtkMessageBox(text, title || '警告', 'warning');
}

/**
 * 错误框
 */
function error(text, title) {
    return gtkMessageBox(text, title || '错误', 'error');
}

/**
 * 确认框（是/否）
 */
function confirm(text, title) {
    var result = gtkMessageBox(text, title || '确认', 'question');
    return result === 6; // IDYES = 6
}

// ============================================================
// 7. D-Bus 通知（桌面通知）
// ============================================================

/**
 * 发送桌面通知（通过 notify-send 命令）
 */
function notify(title, message, urgency, icon) {
    urgency = urgency || 'normal'; // low, normal, critical
    icon = icon || 'dialog-information';
    
    var cmd = 'notify-send';
    var args = '--urgency=' + urgency + ' --icon=' + icon + ' "' + title + '" "' + message + '"';
    
    // 检查 notify-send 是否存在
    if (!fileExists('/usr/bin/notify-send')) {
        return false;
    }
    
    var result = system(cmd + ' ' + args);
    return result === 0;
}

// ============================================================
// 8. 权限检测
// ============================================================

/**
 * 检查当前进程是否以 root 身份运行
 */
function isRoot() {
    return getEuid() === 0;
}

/**
 * 检查是否有 sudo 权限
 */
function hasSudo() {
    try {
        var result = system('sudo -n true 2>/dev/null');
        return result === 0;
    } catch (e) {
        return false;
    }
}

// ============================================================
// 9. 以 root 权限运行（pkexec / sudo）
// ============================================================

/**
 * 以 root 权限运行程序（通过 pkexec 或 sudo）
 * @param {string} exePath - 要执行的程序路径
 * @param {string} args - 命令行参数（可选）
 * @param {string} method - 'pkexec' 或 'sudo'（默认自动选择）
 * @returns {boolean} 是否成功启动
 */
function runAsRoot(exePath, args, method) {
    args = args || '';
    method = method || 'pkexec';
    
    // 如果已经是 root，直接运行
    if (isRoot()) {
        return system(exePath + ' ' + args) === 0;
    }
    
    // 检查 pkexec 是否存在（推荐，因为会弹图形化密码框）
    if (method === 'pkexec' && fileExists('/usr/bin/pkexec')) {
        var cmd = 'pkexec ' + exePath + ' ' + args;
        return system(cmd) === 0;
    }
    
    // 备选：sudo
    if (method === 'sudo' || method === 'auto') {
        if (fileExists('/usr/bin/sudo')) {
            var cmd = 'sudo ' + exePath + ' ' + args;
            return system(cmd) === 0;
        }
    }
    
    return false;
}

/**
 * 以 root 权限运行当前脚本自身
 */
function restartAsRoot(args) {
    args = args || '';
    var scriptPath = getCwd() + '/bootstrap.js';
    // 尝试获取当前脚本路径
    try {
        var Process = dn.type('System.Diagnostics.Process');
        var currentProcess = Process.callStatic('GetCurrentProcess', []);
        var mainModule = currentProcess.callInstance('get_MainModule', []);
        scriptPath = mainModule.callInstance('get_FileName', []);
    } catch (e) {
        // 使用默认路径
    }
    return runAsRoot(scriptPath, args);
}

// ============================================================
// 导出
// ============================================================

module.exports = {
    // 系统信息
    getPid: getPid,
    getUid: getUid,
    getEuid: getEuid,
    getGid: getGid,
    getHostname: getHostname,
    getUptime: getUptime,
    getCwd: getCwd,
    
    // 环境变量
    getEnv: getEnv,
    setEnv: setEnv,
    unsetEnv: unsetEnv,
    
    // 文件
    fileExists: fileExists,
    fileReadable: fileReadable,
    fileWritable: fileWritable,
    fileExecutable: fileExecutable,
    unlink: unlink,
    rmdir: rmdir,
    
    // 进程
    system: system,
    fork: fork,
    execvp: execvp,
    waitpid: waitpid,
    exit: exit,
    kill: kill,
    
    // 信号常量
    SIGTERM: SIGTERM,
    SIGKILL: SIGKILL,
    SIGINT: SIGINT,
    SIGHUP: SIGHUP,
    
    // 动态库
    dlopen: dlopen,
    dlsym: dlsym,
    dlclose: dlclose,
    dlerror: dlerror,
    
    // GTK 对话框
    gtkMessageBox: gtkMessageBox,
    info: info,
    warn: warn,
    error: error,
    confirm: confirm,
    
    // 桌面通知
    notify: notify,
    
    // 权限检测
    isRoot: isRoot,
    hasSudo: hasSudo,
    
    // 提权
    runAsRoot: runAsRoot,
    restartAsRoot: restartAsRoot,
};