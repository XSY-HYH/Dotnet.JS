// 中间层模块，自己 require inner.js
// 验证 middle 的 module.exports 不会污染外层调用者的 exports
var inner = require('./inner.js');
exports.middleValue = "middle_sees_" + inner.value;
