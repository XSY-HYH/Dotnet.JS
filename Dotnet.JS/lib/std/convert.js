// lib/std/convert.js
// 类型转换，桥接 System.Convert
var dn = require('dotnet');
var Convert = dn.type('System.Convert');

function toBase64(bytes) { return dn.callStatic(Convert, 'ToBase64String', [bytes]); }
function fromBase64(str) { return dn.callStatic(Convert, 'FromBase64String', [str]); }
function toInt32(v) { return dn.callStatic(Convert, 'ToInt32', [v]); }
function toInt64(v) { return dn.callStatic(Convert, 'ToInt64', [v]); }
function toDouble(v) { return dn.callStatic(Convert, 'ToDouble', [v]); }
function toSingle(v) { return dn.callStatic(Convert, 'ToSingle', [v]); }
function toDecimal(v) { return dn.callStatic(Convert, 'ToDecimal', [v]); }
function toBoolean(v) { return dn.callStatic(Convert, 'ToBoolean', [v]); }
function toByte(v) { return dn.callStatic(Convert, 'ToByte', [v]); }
function toChar(v) { return dn.callStatic(Convert, 'ToChar', [v]); }
function toString(v) { return dn.callStatic(Convert, 'ToString', [v]); }
function toHexString(bytes) { return dn.callStatic(Convert, 'ToHexString', [bytes]); }
function fromHexString(str) { return dn.callStatic(Convert, 'FromHexString', [str]); }

module.exports = {
    toBase64: toBase64,
    fromBase64: fromBase64,
    toInt32: toInt32,
    toInt64: toInt64,
    toDouble: toDouble,
    toSingle: toSingle,
    toDecimal: toDecimal,
    toBoolean: toBoolean,
    toByte: toByte,
    toChar: toChar,
    toString: toString,
    toHexString: toHexString,
    fromHexString: fromHexString
};
