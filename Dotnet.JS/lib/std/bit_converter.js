// lib/std/bit_converter.js
// 字节序转换，桥接 System.BitConverter
// 注意：GetBytes 因重载歧义未封装，number 无法区分 int/long/double
var dn = require('dotnet');
var BitConverter = dn.type('System.BitConverter');

function toString(bytes, index, count) {
    if (count !== undefined) return dn.callStatic(BitConverter, 'ToString', [bytes, index, count]);
    if (index !== undefined) return dn.callStatic(BitConverter, 'ToString', [bytes, index]);
    return dn.callStatic(BitConverter, 'ToString', [bytes]);
}
function toInt32(bytes, index) { return dn.callStatic(BitConverter, 'ToInt32', [bytes, index || 0]); }
function toInt64(bytes, index) { return dn.callStatic(BitConverter, 'ToInt64', [bytes, index || 0]); }
function toUInt32(bytes, index) { return dn.callStatic(BitConverter, 'ToUInt32', [bytes, index || 0]); }
function toUInt64(bytes, index) { return dn.callStatic(BitConverter, 'ToUInt64', [bytes, index || 0]); }
function toSingle(bytes, index) { return dn.callStatic(BitConverter, 'ToSingle', [bytes, index || 0]); }
function toDouble(bytes, index) { return dn.callStatic(BitConverter, 'ToDouble', [bytes, index || 0]); }
function toChar(bytes, index) { return dn.callStatic(BitConverter, 'ToChar', [bytes, index || 0]); }
function toBoolean(bytes, index) { return dn.callStatic(BitConverter, 'ToBoolean', [bytes, index || 0]); }
function doubleToInt64Bits(d) { return dn.callStatic(BitConverter, 'DoubleToInt64Bits', [d]); }
function int64BitsToDouble(l) { return dn.callStatic(BitConverter, 'Int64BitsToDouble', [l]); }
function halfToUInt16Bits(h) { return dn.callStatic(BitConverter, 'HalfToUInt16Bits', [h]); }
function uInt16BitsToHalf(bits) { return dn.callStatic(BitConverter, 'UInt16BitsToHalf', [bits]); }
function isLittleEndian() { return dn.getProperty(BitConverter, 'IsLittleEndian'); }

module.exports = {
    toString: toString,
    toInt32: toInt32,
    toInt64: toInt64,
    toUInt32: toUInt32,
    toUInt64: toUInt64,
    toSingle: toSingle,
    toDouble: toDouble,
    toChar: toChar,
    toBoolean: toBoolean,
    doubleToInt64Bits: doubleToInt64Bits,
    int64BitsToDouble: int64BitsToDouble,
    halfToUInt16Bits: halfToUInt16Bits,
    uInt16BitsToHalf: uInt16BitsToHalf,
    isLittleEndian: isLittleEndian
};
