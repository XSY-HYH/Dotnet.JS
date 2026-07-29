// lib/std/math.js
// System.Math 扩展，提供 JS Math 没有的函数
var dn = require('dotnet');
var MathNet = dn.type('System.Math');

function clamp(v, min, max) { return dn.callStatic(MathNet, 'Clamp', [v, min, max]); }
function sign(v) { return dn.callStatic(MathNet, 'Sign', [v]); }
function cbrt(v) { return dn.callStatic(MathNet, 'Cbrt', [v]); }
function bigMul(a, b) { return dn.callStatic(MathNet, 'BigMul', [a, b]); }
function log2(v) { return dn.callStatic(MathNet, 'Log2', [v]); }
function log10(v) { return dn.callStatic(MathNet, 'Log10', [v]); }
function ieEEremainder(a, b) { return dn.callStatic(MathNet, 'IEEERemainder', [a, b]); }
function iLogB(v) { return dn.callStatic(MathNet, 'ILogB', [v]); }
function scaleB(x, n) { return dn.callStatic(MathNet, 'ScaleB', [x, n]); }
function copySign(x, y) { return dn.callStatic(MathNet, 'CopySign', [x, y]); }
function maxMagnitude(x, y) { return dn.callStatic(MathNet, 'MaxMagnitude', [x, y]); }
function minMagnitude(x, y) { return dn.callStatic(MathNet, 'MinMagnitude', [x, y]); }
function bitDecrement(x) { return dn.callStatic(MathNet, 'BitDecrement', [x]); }
function bitIncrement(x) { return dn.callStatic(MathNet, 'BitIncrement', [x]); }
function truncate(x) { return dn.callStatic(MathNet, 'Truncate', [x]); }
function reciprocalEstimate(x) { return dn.callStatic(MathNet, 'ReciprocalEstimate', [x]); }
function sqrtEstimate(x) { return dn.callStatic(MathNet, 'SqrtEstimate', [x]); }
function acosh(x) { return dn.callStatic(MathNet, 'Acosh', [x]); }
function asinh(x) { return dn.callStatic(MathNet, 'Asinh', [x]); }
function atanh(x) { return dn.callStatic(MathNet, 'Atanh', [x]); }
function sinh(x) { return dn.callStatic(MathNet, 'Sinh', [x]); }
function cosh(x) { return dn.callStatic(MathNet, 'Cosh', [x]); }
function tanh(x) { return dn.callStatic(MathNet, 'Tanh', [x]); }
function divRem(a, b) {
    var q = a >= 0 ? Math.floor(a / b) : Math.ceil(a / b);
    return { quotient: q, remainder: a - q * b };
}

module.exports = {
    clamp: clamp,
    sign: sign,
    cbrt: cbrt,
    bigMul: bigMul,
    log2: log2,
    log10: log10,
    ieEEremainder: ieEEremainder,
    iLogB: iLogB,
    scaleB: scaleB,
    copySign: copySign,
    maxMagnitude: maxMagnitude,
    minMagnitude: minMagnitude,
    bitDecrement: bitDecrement,
    bitIncrement: bitIncrement,
    truncate: truncate,
    reciprocalEstimate: reciprocalEstimate,
    sqrtEstimate: sqrtEstimate,
    acosh: acosh,
    asinh: asinh,
    atanh: atanh,
    sinh: sinh,
    cosh: cosh,
    tanh: tanh,
    divRem: divRem
};
