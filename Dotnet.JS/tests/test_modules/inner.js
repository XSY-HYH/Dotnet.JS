// 内层模块，用于验证 require 嵌套不污染外层
var privateVar = "should_not_leak";

exports.value = "inner_value";
exports.compute = function(x) {
    return x * x;
};
