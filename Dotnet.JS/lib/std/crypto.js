// lib/std/crypto.js
// 哈希与 HMAC，桥接 System.Security.Cryptography
// 输入输出均为字节数组，字符串需先经 text.getBytes 转换
var dn = require('dotnet');
var MD5 = dn.type('System.Security.Cryptography.MD5');
var SHA1 = dn.type('System.Security.Cryptography.SHA1');
var SHA256 = dn.type('System.Security.Cryptography.SHA256');
var SHA384 = dn.type('System.Security.Cryptography.SHA384');
var SHA512 = dn.type('System.Security.Cryptography.SHA512');
var HMACMD5 = dn.type('System.Security.Cryptography.HMACMD5');
var HMACSHA1 = dn.type('System.Security.Cryptography.HMACSHA1');
var HMACSHA256 = dn.type('System.Security.Cryptography.HMACSHA256');
var HMACSHA384 = dn.type('System.Security.Cryptography.HMACSHA384');
var HMACSHA512 = dn.type('System.Security.Cryptography.HMACSHA512');
var RandomNumberGenerator = dn.type('System.Security.Cryptography.RandomNumberGenerator');

function hashBytes(hashType, bytes) {
    var hasher = dn.callStatic(hashType, 'Create', []);
    return dn.callInstance(hashType, hasher, 'ComputeHash', [bytes]);
}

function md5(bytes) { return hashBytes(MD5, bytes); }
function sha1(bytes) { return hashBytes(SHA1, bytes); }
function sha256(bytes) { return hashBytes(SHA256, bytes); }
function sha384(bytes) { return hashBytes(SHA384, bytes); }
function sha512(bytes) { return hashBytes(SHA512, bytes); }

function hmac(hashType, key, bytes) {
    var hasher = dn.createInstance(hashType, [key]);
    return dn.callInstance(hashType, hasher, 'ComputeHash', [bytes]);
}
function hmacMd5(key, bytes) { return hmac(HMACMD5, key, bytes); }
function hmacSha1(key, bytes) { return hmac(HMACSHA1, key, bytes); }
function hmacSha256(key, bytes) { return hmac(HMACSHA256, key, bytes); }
function hmacSha384(key, bytes) { return hmac(HMACSHA384, key, bytes); }
function hmacSha512(key, bytes) { return hmac(HMACSHA512, key, bytes); }

// RandomNumberGenerator 静态便捷 API（.NET 6+）
function randomBytes(count) { return dn.callStatic(RandomNumberGenerator, 'GetBytes', [count]); }
function randomInt32(from, to) {
    if (to !== undefined) return dn.callStatic(RandomNumberGenerator, 'GetInt32', [from, to]);
    return dn.callStatic(RandomNumberGenerator, 'GetInt32', [0, from]);
}
function randomInt64() { return dn.callStatic(RandomNumberGenerator, 'GetInt64', []); }
function randomSingle() { return dn.callStatic(RandomNumberGenerator, 'GetSingle', []); }
function randomDouble() { return dn.callStatic(RandomNumberGenerator, 'GetDouble', []); }

module.exports = {
    md5: md5,
    sha1: sha1,
    sha256: sha256,
    sha384: sha384,
    sha512: sha512,
    hmacMd5: hmacMd5,
    hmacSha1: hmacSha1,
    hmacSha256: hmacSha256,
    hmacSha384: hmacSha384,
    hmacSha512: hmacSha512,
    randomBytes: randomBytes,
    randomInt32: randomInt32,
    randomInt64: randomInt64,
    randomSingle: randomSingle,
    randomDouble: randomDouble
};
