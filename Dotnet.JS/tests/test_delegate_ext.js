var dn = require('dotnet');

var libPath = 'D:\\Programming\\C#\\JintRepl\\JintTestLib\\bin\\Debug\\net10.0\\JintTestLib.dll';
var lib = dn.loadFrom(libPath);
console.log('类库:', lib.name);

var Calculator = dn.getType(lib, 'JintTestLib.Calculator');
var MathExtensions = dn.getType(lib, 'JintTestLib.MathExtensions');

var calc = dn.createInstance(Calculator, []);

console.log('\n=== 重载测试 ===');
try {
    console.log('Format(42):', dn.callInstance(Calculator, calc, 'Format', [42]));
} catch(e) { console.log('Format(42) 失败:', e.message); }
try {
    console.log('Format("hi"):', dn.callInstance(Calculator, calc, 'Format', ['hi']));
} catch(e) { console.log('Format("hi") 失败:', e.message); }

console.log('\n=== params 与固定参数重载 ===');
try {
    console.log('Sum(1,2,3):', dn.callInstance(Calculator, calc, 'Sum', [1, 2, 3]));
} catch(e) { console.log('Sum(1,2,3) 失败:', e.message); }
try {
    console.log('Sum(1,2):', dn.callInstance(Calculator, calc, 'Sum', [1, 2]));
} catch(e) { console.log('Sum(1,2) 失败:', e.message); }

console.log('\n=== 扩展方法（静态调用）===');
try {
    console.log('Double(5):', dn.callStatic(MathExtensions, 'Double', [5]));
} catch(e) { console.log('Double(5) 失败:', e.message); }
try {
    console.log('Double(5,3):', dn.callStatic(MathExtensions, 'Double', [5, 3]));
} catch(e) { console.log('Double(5,3) 失败:', e.message); }
try {
    console.log('Shout("hi"):', dn.callStatic(MathExtensions, 'Shout', ['hi']));
} catch(e) { console.log('Shout("hi") 失败:', e.message); }

console.log('\n=== 委托测试：JS 函数作为 MathOp 委托 ===');
try {
    var result = dn.callInstance(Calculator, calc, 'Apply', [function(a, b) { return a + b; }, 3, 4]);
    console.log('Apply(add, 3, 4):', result);
} catch(e) { console.log('Apply(MathOp) 失败:', e.message); }

console.log('\n=== 委托测试：JS 函数作为 Func<int,int,int> ===');
try {
    var result2 = dn.callInstance(Calculator, calc, 'ApplyFunc', [function(a, b) { return a * b; }, 3, 4]);
    console.log('ApplyFunc(mul, 3, 4):', result2);
} catch(e) { console.log('ApplyFunc(Func) 失败:', e.message); }

console.log('\n=== 委托属性赋值测试 ===');
try {
    dn.setInstanceProperty(Calculator, calc, 'Op', function(a, b) { return a - b; });
    console.log('RunOp(10, 3):', dn.callInstance(Calculator, calc, 'RunOp', [10, 3]));
} catch(e) { console.log('委托属性赋值失败:', e.message); }

console.log('\n=== 测试完成 ===');
