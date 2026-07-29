// lib/std/text_builder.js
// 高频字符串拼接，桥接 System.Text.StringBuilder
var dn = require('dotnet');
var StringBuilder = dn.type('System.Text.StringBuilder');

function create(str) {
    return str !== undefined
        ? dn.createInstance(StringBuilder, [str])
        : dn.createInstance(StringBuilder, []);
}
function append(sb, str) { dn.callInstance(StringBuilder, sb, 'Append', [str]); return sb; }
function appendLine(sb, str) {
    if (str !== undefined) dn.callInstance(StringBuilder, sb, 'AppendLine', [str]);
    else dn.callInstance(StringBuilder, sb, 'AppendLine', []);
    return sb;
}
function appendFormat(sb, format, args) {
    dn.callInstance(StringBuilder, sb, 'AppendFormat', [format, args]);
    return sb;
}
function insert(sb, index, str) { dn.callInstance(StringBuilder, sb, 'Insert', [index, str]); return sb; }
function remove(sb, index, length) { dn.callInstance(StringBuilder, sb, 'Remove', [index, length]); return sb; }
function replace(sb, old, newStr) { dn.callInstance(StringBuilder, sb, 'Replace', [old, newStr]); return sb; }
function toString(sb, start, length) {
    if (length !== undefined) return dn.callInstance(StringBuilder, sb, 'ToString', [start, length]);
    return dn.callInstance(StringBuilder, sb, 'ToString', []);
}
function getLength(sb) { return dn.getInstanceProperty(StringBuilder, sb, 'Length'); }
function setLength(sb, len) { dn.setInstanceProperty(StringBuilder, sb, 'Length', len); }
function getCapacity(sb) { return dn.getInstanceProperty(StringBuilder, sb, 'Capacity'); }
function setCapacity(sb, cap) { dn.setInstanceProperty(StringBuilder, sb, 'Capacity', cap); }
function clear(sb) { dn.callInstance(StringBuilder, sb, 'Clear', []); return sb; }
function indexOf(sb, str, start, count) {
    if (count !== undefined) return dn.callInstance(StringBuilder, sb, 'IndexOf', [str, start, count]);
    if (start !== undefined) return dn.callInstance(StringBuilder, sb, 'IndexOf', [str, start]);
    return dn.callInstance(StringBuilder, sb, 'IndexOf', [str]);
}

module.exports = {
    create: create,
    append: append,
    appendLine: appendLine,
    appendFormat: appendFormat,
    insert: insert,
    remove: remove,
    replace: replace,
    toString: toString,
    getLength: getLength,
    setLength: setLength,
    getCapacity: getCapacity,
    setCapacity: setCapacity,
    clear: clear,
    indexOf: indexOf
};
