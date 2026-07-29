// lib/std/random.js
// 伪随机数，桥接 System.Random（用静态 Shared 实例）
var dn = require('dotnet');
var Random = dn.type('System.Random');

var _shared = null;
function shared() {
    if (!_shared) _shared = dn.getProperty(Random, 'Shared');
    return _shared;
}

function next(minOrMax, max) {
    if (max === undefined) {
        return minOrMax === undefined
            ? dn.callInstance(Random, shared(), 'Next', [])
            : dn.callInstance(Random, shared(), 'Next', [minOrMax]);
    }
    return dn.callInstance(Random, shared(), 'Next', [minOrMax, max]);
}

function nextDouble() { return dn.callInstance(Random, shared(), 'NextDouble', []); }
function nextInt64() { return dn.callInstance(Random, shared(), 'NextInt64', []); }
function nextBytes(buffer) { dn.callInstance(Random, shared(), 'NextBytes', [buffer]); }

module.exports = {
    next: next,
    nextDouble: nextDouble,
    nextInt64: nextInt64,
    nextBytes: nextBytes
};
