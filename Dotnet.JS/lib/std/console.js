// lib/std/console.js
var dn = require('dotnet');
var Console = dn.type('System.Console');
var ConsoleColor = dn.type('System.ConsoleColor');

function joinArgs(args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a === null) parts.push('null');
        else if (a === undefined) parts.push('undefined');
        else if (typeof a === 'string') parts.push(a);
        else {
            try { parts.push(JSON.stringify(a)); }
            catch (e) { parts.push(String(a)); }
        }
    }
    return parts.join(' ');
}

function log() { dn.callStatic(Console, 'WriteLine', [joinArgs(arguments)]); }
function write() { dn.callStatic(Console, 'Write', [joinArgs(arguments)]); }
function info() { dn.callStatic(Console, 'WriteLine', [joinArgs(arguments)]); }
function debug() { dn.callStatic(Console, 'WriteLine', ['[DEBUG] ' + joinArgs(arguments)]); }
function warn() { dn.callStatic(Console, 'WriteLine', ['[WARN] ' + joinArgs(arguments)]); }
function error() { dn.callStatic(Console, 'WriteLine', ['[ERROR] ' + joinArgs(arguments)]); }

function clear() { dn.callStatic(Console, 'Clear', []); }

// color 是 ConsoleColor 枚举名 Red/Green/Blue/...
function setColor(color) {
    var colorEnum = dn.getProperty(ConsoleColor, color);
    dn.callStatic(Console, 'set_ForegroundColor', [colorEnum]);
}

function setBackgroundColor(color) {
    var colorEnum = dn.getProperty(ConsoleColor, color);
    dn.callStatic(Console, 'set_BackgroundColor', [colorEnum]);
}

function resetColor() { dn.callStatic(Console, 'ResetColor', []); }

module.exports = {
    log: log,
    write: write,
    info: info,
    debug: debug,
    warn: warn,
    error: error,
    clear: clear,
    setColor: setColor,
    setBackgroundColor: setBackgroundColor,
    resetColor: resetColor
};
