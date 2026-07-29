// lib/std/time.js
// 时间日期，桥接 System.DateTime + TimeSpan
var dn = require('dotnet');
var DateTime = dn.type('System.DateTime');
var TimeSpan = dn.type('System.TimeSpan');

function now() { return dn.getProperty(DateTime, 'Now'); }
function utcNow() { return dn.getProperty(DateTime, 'UtcNow'); }
function today() { return dn.getProperty(DateTime, 'Today'); }
function minValue() { return dn.getProperty(DateTime, 'MinValue'); }
function maxValue() { return dn.getProperty(DateTime, 'MaxValue'); }

function parse(s) { return dn.callStatic(DateTime, 'Parse', [s]); }
function parseExact(s, format) { return dn.callStatic(DateTime, 'ParseExact', [s, format]); }
function tryParse(s) {
    try { return dn.callStatic(DateTime, 'Parse', [s]); }
    catch (e) { return null; }
}

function create(year, month, day, hour, minute, second, millisecond) {
    if (millisecond !== undefined) return dn.createInstance(DateTime, [year, month, day, hour, minute, second, millisecond]);
    if (second !== undefined) return dn.createInstance(DateTime, [year, month, day, hour, minute, second]);
    if (minute !== undefined) return dn.createInstance(DateTime, [year, month, day, hour, minute]);
    if (hour !== undefined) return dn.createInstance(DateTime, [year, month, day, hour]);
    return dn.createInstance(DateTime, [year, month, day]);
}

function daysInMonth(year, month) { return dn.callStatic(DateTime, 'DaysInMonth', [year, month]); }
function isLeapYear(year) { return dn.callStatic(DateTime, 'IsLeapYear', [year]); }
function compare(a, b) { return dn.callStatic(DateTime, 'Compare', [a, b]); }

// TimeSpan 构造
function fromDays(days) { return dn.callStatic(TimeSpan, 'FromDays', [days]); }
function fromHours(hours) { return dn.callStatic(TimeSpan, 'FromHours', [hours]); }
function fromMinutes(minutes) { return dn.callStatic(TimeSpan, 'FromMinutes', [minutes]); }
function fromSeconds(seconds) { return dn.callStatic(TimeSpan, 'FromSeconds', [seconds]); }
function fromMilliseconds(ms) { return dn.callStatic(TimeSpan, 'FromMilliseconds', [ms]); }
function fromTicks(ticks) { return dn.callStatic(TimeSpan, 'FromTicks', [ticks]); }

// 实例方法：format 是 DateTime/TimeSpan 实例
function toString(format, fmt) {
    return fmt !== undefined
        ? dn.callInstance(DateTime, format, 'ToString', [fmt])
        : dn.callInstance(DateTime, format, 'ToString', []);
}

function toStringTs(ts, fmt) {
    return dn.callInstance(TimeSpan, ts, 'ToString', []);
}

module.exports = {
    now: now,
    utcNow: utcNow,
    today: today,
    minValue: minValue,
    maxValue: maxValue,
    parse: parse,
    parseExact: parseExact,
    tryParse: tryParse,
    create: create,
    daysInMonth: daysInMonth,
    isLeapYear: isLeapYear,
    compare: compare,
    fromDays: fromDays,
    fromHours: fromHours,
    fromMinutes: fromMinutes,
    fromSeconds: fromSeconds,
    fromMilliseconds: fromMilliseconds,
    fromTicks: fromTicks,
    toString: toString,
    toStringTs: toStringTs
};
