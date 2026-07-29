// lib/std/app.js
// 应用上下文，桥接 System.AppContext
var dn = require('dotnet');
var AppContext = dn.type('System.AppContext');

function getTargetFrameworkName() {
    try { return dn.callStatic(AppContext, 'GetTargetFrameworkName', []); }
    catch (e) { return null; }
}
function baseDirectory() { return dn.getProperty(AppContext, 'BaseDirectory'); }
function getData(name) { return dn.callStatic(AppContext, 'GetData', [name]); }
function setSwitch(name, value) { dn.callStatic(AppContext, 'SetSwitch', [name, value === true]); }
function tryGetSwitch(name) {
    // 无 out 参数桥接，用异常兜底
    try { return dn.callStatic(AppContext, 'GetData', [name]); }
    catch (e) { return null; }
}

module.exports = {
    getTargetFrameworkName: getTargetFrameworkName,
    baseDirectory: baseDirectory,
    getData: getData,
    setSwitch: setSwitch,
    tryGetSwitch: tryGetSwitch
};
