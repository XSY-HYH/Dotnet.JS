// 验证 bootstrap 新增挂载：asp / Buffer / timers，且 process.argv 未被 node 覆盖
var ok = true;
function check(cond, msg) {
    console.log((cond ? '[OK] ' : '[FAIL] ') + msg);
    if (!cond) ok = false;
}

check(typeof asp === 'object' && asp !== null, 'asp 挂载为对象');
check(typeof asp.createBuilder === 'function', 'asp.createBuilder 存在');

check(typeof Buffer === 'function', 'Buffer 挂载为函数');
var buf = Buffer.from('abc');
check(buf && buf.length === 3 && buf.toString() === 'abc', 'Buffer.from/toString 正常');

check(typeof setImmediate === 'function', 'setImmediate 挂载');
check(typeof clearImmediate === 'function', 'clearImmediate 挂载');
check(typeof nextTick === 'function', 'nextTick 挂载');

// process 应保持 std/process（有 argv0，无 env），未被 node/process 覆盖
check(process.argv && process.argv.length > 0, 'process.argv 可访问: ' + JSON.stringify(process.argv));
check(typeof process.argv0 !== 'undefined', 'process.argv0 存在（std/process 独有）');
check(typeof process.env === 'undefined', 'process.env 不存在（node/process 未覆盖）');

console.log(ok ? '\nALL PASS' : '\nSOME FAILED');
