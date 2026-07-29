// 外层模块：require middle 之后必须还能设置自己的 exports
// 旧 bug：require 之后 module 被覆盖，exports.outerValue = "outer_value" 会写到 middle 的 exports
var middle = require('./middle.js');
exports.outerValue = "outer_value";
exports.middleValue = middle.middleValue;
