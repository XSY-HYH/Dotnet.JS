// lib/std/logging/logger.js
// 封装 logs.dll 中的日志功能 (Logging.Log)

var dn = require('std/dotnet');
var path = require('std/path');

// 获取当前目录
var currentDir = path.getDirectoryName(__filename);
var nclDir = path.combine(currentDir, '../../ncl');
var dllPath = path.combine(nclDir, 'logs.dll');

// 加载程序集
try {
    dn.loadFrom(dllPath);
} catch (e) {
    console.error('无法加载 logs.dll，请确认文件存在:', dllPath);
    throw e;
}

// 获取类型
var Log = dn.type('Logging.Log');
var LogLevel = dn.type('Logging.LogLevel');

if (!Log) {
    throw new Error('无法获取 Logging.Log 类型，请确认 logs.dll 正确');
}

// 获取 LogLevel 枚举值
var LogLevelEnum = {
    Debug: LogLevel.getProperty('Debug'),
    Info: LogLevel.getProperty('Info'),
    Warning: LogLevel.getProperty('Warning'),
    Error: LogLevel.getProperty('Error'),
    Critical: LogLevel.getProperty('Critical'),
    None: LogLevel.getProperty('None')
};

// 获取 Log 类型（用于 callStatic）
var LogType = Log; // Log 本身就是一个 TypeWrapper

// ============================================================
// 日志方法封装
// ============================================================

/**
 * 获取调用者信息（文件、行号、方法名）用于日志记录
 * 注意：由于 Jint 无法获取调用栈信息，这里提供简化版，用户可以自行传递
 * 默认使用占位符 "unknown"
 */
function getCallerInfo() {
    // 由于 Jint 无法获取调用栈，我们返回 "unknown" 占位符
    // 用户可以在调用时自行传入文件路径和行号
    return {
        filePath: 'unknown',
        lineNumber: 0,
        memberName: 'unknown'
    };
}

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {string} filePath - 文件路径（可选，默认 'unknown'）
 * @param {number} lineNumber - 行号（可选，默认 0）
 * @param {string} memberName - 方法名（可选，默认 'unknown'）
 */
function debug(message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    dn.callStatic(LogType, 'Debug', [message, filePath, lineNumber, memberName]);
}

/**
 * 记录信息日志
 */
function info(message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    dn.callStatic(LogType, 'Info', [message, filePath, lineNumber, memberName]);
}

/**
 * 记录警告日志
 */
function warn(message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    dn.callStatic(LogType, 'Warning', [message, filePath, lineNumber, memberName]);
}

/**
 * 记录错误日志
 */
function error(message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    dn.callStatic(LogType, 'Error', [message, filePath, lineNumber, memberName]);
}

/**
 * 记录严重错误日志
 */
function critical(message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    dn.callStatic(LogType, 'Critical', [message, filePath, lineNumber, memberName]);
}

/**
 * 记录异常日志
 * @param {object} exception - .NET Exception 对象（或任何可转为字符串的对象）
 * @param {string} message - 附加消息（可选）
 */
function exception(exception, message, filePath, lineNumber, memberName) {
    filePath = filePath || 'unknown';
    lineNumber = lineNumber || 0;
    memberName = memberName || 'unknown';
    if (typeof message !== 'string') {
        // 如果第二个参数不是字符串，则视为没有附加消息
        memberName = lineNumber;
        lineNumber = filePath;
        filePath = message;
        message = '';
    }
    // 如果 exception 是字符串，尝试转换为 .NET Exception？这里简化，传入字符串
    // 但 Log.Exception 期望第一个参数是 Exception 类型，我们最好传入一个真实的异常对象
    // 但由于 Jint 可能无法构造 .NET 异常，我们暂时用字符串替代，并调整调用方式
    // 实际上，Log.Exception 方法接受 Exception 和 message，我们看看能否用字符串
    // 根据反编译，Log.Exception 的第一个参数是 Exception ex，如果传入字符串可能会出错
    // 我们提供一个变通：直接调用 Error 并附加异常信息
    // 或者我们尝试用 .NET 的 Exception 类型
    try {
        var Exception = dn.type('System.Exception');
        var exObj = dn.createInstance(Exception, [exception ? exception.toString() : '']);
        dn.callStatic(LogType, 'Exception', [exObj, message || '', filePath, lineNumber, memberName]);
    } catch (e) {
        // 如果无法创建 Exception，则直接用 Error 记录
        error('EXCEPTION: ' + (exception ? exception.toString() : 'null') + ' - ' + (message || ''), filePath, lineNumber, memberName);
    }
}

// ============================================================
// 配置方法
// ============================================================

/**
 * 设置控制台日志输出级别
 * @param {string} level - 'Debug', 'Info', 'Warning', 'Error', 'Critical', 'None'
 */
function setConsoleLevel(level) {
    var levelEnum = LogLevelEnum[level];
    if (levelEnum === undefined) {
        throw new Error('Invalid log level: ' + level);
    }
    dn.callStatic(LogType, 'SetConsoleLevel', [levelEnum]);
}

/**
 * 设置文件日志输出级别
 * @param {string} level - 'Debug', 'Info', 'Warning', 'Error', 'Critical', 'None'
 */
function setFileLevel(level) {
    var levelEnum = LogLevelEnum[level];
    if (levelEnum === undefined) {
        throw new Error('Invalid log level: ' + level);
    }
    dn.callStatic(LogType, 'SetFileLevel', [levelEnum]);
}

/**
 * 启用/禁用文件日志
 * @param {boolean} enable - true 启用，false 禁用
 */
function enableFileLogging(enable) {
    dn.callStatic(LogType, 'EnableFileLogging', [enable]);
}

/**
 * 设置日志文件存储目录
 * @param {string} directory - 目录路径
 */
function setLogDirectory(directory) {
    dn.callStatic(LogType, 'SetLogDirectory', [directory]);
}

/**
 * 设置控制台日志格式
 * @param {string} format - 格式字符串，支持 {timestamp}, {level}, {source}, {file}, {line}, {member}, {message}, {newline}, {tab}, {space}
 */
function setConsoleFormat(format) {
    dn.callStatic(LogType, 'SetConsoleFormat', [format]);
}

/**
 * 设置文件日志格式
 * @param {string} format - 同上
 */
function setFileFormat(format) {
    dn.callStatic(LogType, 'SetFileFormat', [format]);
}

/**
 * 设置时间戳格式
 * @param {string} format - 标准 .NET 日期时间格式字符串，如 "yyyy-MM-dd HH:mm:ss,fff"
 */
function setTimestampFormat(format) {
    dn.callStatic(LogType, 'SetTimestampFormat', [format]);
}

/**
 * 重置所有格式为默认值
 */
function resetToDefaultFormats() {
    dn.callStatic(LogType, 'ResetToDefaultFormats', []);
}

/**
 * 设置默认日志源（上下文名称）
 * @param {string} source - 源名称
 */
function setDefaultSource(source) {
    dn.callStatic(LogType, 'SetDefaultSource', [source]);
}

/**
 * 推送临时源（用于作用域上下文）
 * @param {string} source - 源名称
 * @returns {object} 一个实现了 IDisposable 的对象，调用 dispose() 恢复之前的源
 */
function pushSource(source) {
    var disposable = dn.callStatic(LogType, 'PushSource', [source]);
    return {
        dispose: function() {
            if (disposable && typeof disposable.Dispose === 'function') {
                disposable.Dispose();
            } else if (disposable && typeof disposable.dispose === 'function') {
                disposable.dispose();
            }
        }
    };
}

/**
 * 获取当前的警告计数
 * @returns {number}
 */
function getWarningCount() {
    return dn.callStatic(LogType, 'get_WarningCount', []);
}

/**
 * 获取当前的错误计数
 * @returns {number}
 */
function getErrorCount() {
    return dn.callStatic(LogType, 'get_ErrorCount', []);
}

/**
 * 获取最后一条警告消息
 * @returns {string}
 */
function getLastWarningMessage() {
    return dn.callStatic(LogType, 'get_LastWarningMessage', []);
}

/**
 * 获取最后一条错误消息
 * @returns {string}
 */
function getLastErrorMessage() {
    return dn.callStatic(LogType, 'get_LastErrorMessage', []);
}
function name(source) {
    dn.callStatic(LogType, 'Name', [source]);
}
// ============================================================
// 导出一个便捷的日志对象
// ============================================================

module.exports = {
    // 日志方法
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    critical: critical,
    exception: exception,
    
    // 别名
    log: info,
    warning: warn,
    err: error,
    crit: critical,
    ex: exception,
    
    // 配置
    setConsoleLevel: setConsoleLevel,
    setFileLevel: setFileLevel,
    enableFileLogging: enableFileLogging,
    setLogDirectory: setLogDirectory,
    setConsoleFormat: setConsoleFormat,
    setFileFormat: setFileFormat,
    setTimestampFormat: setTimestampFormat,
    resetToDefaultFormats: resetToDefaultFormats,
    setDefaultSource: setDefaultSource,
    name: name,           // ← 加上这一行
    pushSource: pushSource,
    
    // 统计
    getWarningCount: getWarningCount,
    getErrorCount: getErrorCount,
    getLastWarningMessage: getLastWarningMessage,
    getLastErrorMessage: getLastErrorMessage,
    
    // LogLevel 枚举
    LogLevel: LogLevelEnum
};