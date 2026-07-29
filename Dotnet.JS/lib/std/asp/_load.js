// lib/std/asp/_load.js
// 加载 ncl 目录下的 ASP.NET Core 核心程序集
var dn = require('dotnet');
var path = require('std/path');

var nclDir = path.combine(path.getDirectoryName(__filename), '../../ncl');
var cache = {};

// 按文件名加载 ncl 下的 dll，已加载的复用
function ensure(name) {
    if (cache[name]) return cache[name];
    var dllPath = path.combine(nclDir, name + '.dll');
    try {
        cache[name] = dn.loadFrom(dllPath);
    } catch (e) {
        cache[name] = null;
    }
    return cache[name];
}

// ASP.NET Core 运行必需的核心程序集
[
    'Microsoft.AspNetCore',
    'Microsoft.AspNetCore.Routing',
    'Microsoft.AspNetCore.Http',
    'Microsoft.AspNetCore.Http.Abstractions',
    'Microsoft.AspNetCore.Http.Extensions',
    'Microsoft.AspNetCore.Http.Features',
    'Microsoft.AspNetCore.Http.Results',
    'Microsoft.AspNetCore.Hosting',
    'Microsoft.AspNetCore.Hosting.Abstractions',
    'Microsoft.AspNetCore.Server.Kestrel',
    'Microsoft.AspNetCore.Server.Kestrel.Core',
    'Microsoft.Extensions.DependencyInjection',
    'Microsoft.Extensions.DependencyInjection.Abstractions',
    'Microsoft.Extensions.Configuration',
    'Microsoft.Extensions.Configuration.Abstractions',
    'Microsoft.Extensions.Configuration.Json',
    'Microsoft.Extensions.Configuration.EnvironmentVariables',
    'Microsoft.Extensions.Logging',
    'Microsoft.Extensions.Logging.Abstractions',
    'Microsoft.Extensions.Logging.Console',
    'Microsoft.Extensions.Options',
    'Microsoft.Extensions.Primitives',
    'Microsoft.Extensions.FileProviders.Abstractions',
    'Microsoft.Extensions.FileProviders.Physical',
    'Microsoft.Extensions.Hosting',
    'Microsoft.Extensions.Hosting.Abstractions',
    'Microsoft.AspNetCore.StaticFiles',
    'Microsoft.AspNetCore.Diagnostics'
].forEach(ensure);

// 按全名取类型，找不到时抛异常
function t(typeName) {
    var type = dn.type(typeName);
    if (!type) throw new Error('ASP 类型未找到: ' + typeName);
    return type;
}

module.exports = {
    nclDir: nclDir,
    ensure: ensure,
    t: t
};
