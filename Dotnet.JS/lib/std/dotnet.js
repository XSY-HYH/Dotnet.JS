// lib/std/dotnet.js
// 底层 CLR 桥接封装，其他标准库依赖此模块

var assemblyCache = {};

function load(name) {
    if (assemblyCache[name]) return assemblyCache[name];
    var asm = __load_assembly(name);
    if (asm) assemblyCache[name] = asm;
    return asm;
}

function loadFrom(path) {
    return __load_assembly_from(path);
}

// 按类型名查找，遍历所有已加载程序集
function type(name) {
    // 先尝试直接查找
    var result = __find_type(name);
    if (result !== null) return result;
    
    // 实在找不到，抛出异常
    throw new Error('type not found: ' + name);
}

// 从指定程序集获取类型
function getType(assembly, name) {
    if (typeof assembly === 'string') {
        var asm = load(assembly);
        return asm ? asm.getType(name) : null;
    }
    return assembly ? assembly.getType(name) : null;
}

function createInstance(type, args) {
    args = args || [];
    return type ? type.createInstance(args) : null;
}

function callStatic(type, method, args) {
    args = args || [];
    return type ? type.callStatic(method, args) : null;
}

// 实例方法调用，type 是 TypeWrapper，instance 是 CLR 实例
function callInstance(type, instance, method, args) {
    args = args || [];
    return type ? type.callInstance(instance, method, args) : null;
}

function getProperty(type, name) {
    return type ? type.getProperty(name) : null;
}

function setProperty(type, name, value) {
    if (type) type.setProperty(name, value);
}

function getInstanceProperty(type, instance, name) {
    return type ? type.getInstanceProperty(instance, name) : null;
}

function setInstanceProperty(type, instance, name, value) {
    if (type) type.setInstanceProperty(instance, name, value);
}

module.exports = {
    load: load,
    loadFrom: loadFrom,
    type: type,
    getType: getType,
    createInstance: createInstance,
    callStatic: callStatic,
    callInstance: callInstance,
    getProperty: getProperty,
    setProperty: setProperty,
    getInstanceProperty: getInstanceProperty,
    setInstanceProperty: setInstanceProperty
};