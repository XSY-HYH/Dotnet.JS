function main(args) {
    console.log("=== 测试嵌套 require 作用域隔离 ===");

    // outer.js 会 require middle.js，middle.js 会 require inner.js
    // 旧 bug：middle 的 module.exports 会覆盖 outer 的
    var outer = require('./test_modules/outer.js');
    console.log("outer.outerValue =", outer.outerValue, "(期望 outer_value)");
    console.log("outer.middleValue =", outer.middleValue, "(期望 middle_sees_inner_value)");

    if (outer.outerValue !== "outer_value") {
        console.error("FAIL: outer 的 exports 被 middle 污染");
        return 1;
    }
    if (outer.middleValue !== "middle_sees_inner_value") {
        console.error("FAIL: middle 没拿到 inner 的值");
        return 1;
    }

    console.log("=== 嵌套 require 隔离测试通过 ===");
    return 0;
}
