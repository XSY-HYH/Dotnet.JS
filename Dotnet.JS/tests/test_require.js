function main(args) {
    console.log("=== 测试 require 作用域隔离 ===");

    // 测试嵌套 require 不污染外层 module
    var inner = require('./test_modules/inner.js');
    console.log("inner.value =", inner.value, "(期望 inner_value)");
    console.log("inner.compute =", inner.compute(5), "(期望 25)");

    // require 后外层 module/exports 不应被污染
    if (typeof module !== 'undefined' && module.exports !== undefined) {
        console.log("外层 module.exports 仍可用:", typeof module.exports);
    }

    // 重复 require 应走缓存
    var inner2 = require('./test_modules/inner.js');
    if (inner === inner2) {
        console.log("重复 require 走缓存 ✓");
    } else {
        console.error("FAIL: 重复 require 未走缓存");
        return 1;
    }

    console.log("=== require 测试通过 ===");
    return 0;
}
