// lib/std/json.js
// JS 对象序列化用内置 JSON
// CLR 对象需要 STJ 时用 dn.callStatic 手动传 Type 和 options
function serialize(obj, replacer, indent) {
    return JSON.stringify(obj, replacer, indent);
}

function deserialize(json, reviver) {
    return JSON.parse(json, reviver);
}

module.exports = {
    serialize: serialize,
    deserialize: deserialize
};
