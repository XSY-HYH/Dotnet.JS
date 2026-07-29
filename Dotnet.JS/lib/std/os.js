// lib/std/os.js
var dn = require('dotnet');
var Environment = dn.type('System.Environment');

function getEnvironmentVariable(name) { return dn.callStatic(Environment, 'GetEnvironmentVariable', [name]); }
function setEnvironmentVariable(name, value) { dn.callStatic(Environment, 'SetEnvironmentVariable', [name, value]); }
function getEnvironmentVariables() { return dn.callStatic(Environment, 'GetEnvironmentVariables', []); }
function getCommandLineArgs() { return dn.callStatic(Environment, 'GetCommandLineArgs', []); }

function tickCount() { return dn.getProperty(Environment, 'TickCount'); }
function tickCount64() { return dn.getProperty(Environment, 'TickCount64'); }
function osVersion() { return dn.getProperty(Environment, 'OSVersion'); }
function processorCount() { return dn.getProperty(Environment, 'ProcessorCount'); }
function workingSet() { return dn.getProperty(Environment, 'WorkingSet'); }
function is64BitProcess() { return dn.getProperty(Environment, 'Is64BitProcess'); }
function is64BitOperatingSystem() { return dn.getProperty(Environment, 'Is64BitOperatingSystem'); }
function machineName() { return dn.getProperty(Environment, 'MachineName'); }
function userName() { return dn.getProperty(Environment, 'UserName'); }
function userDomainName() { return dn.getProperty(Environment, 'UserDomainName'); }
function systemDirectory() { return dn.getProperty(Environment, 'SystemDirectory'); }
function currentManagedThreadId() { return dn.getProperty(Environment, 'CurrentManagedThreadId'); }
function newline() { return dn.getProperty(Environment, 'NewLine'); }

function exit(code) { dn.callStatic(Environment, 'Exit', [code || 0]); }
function failFast(msg) { dn.callStatic(Environment, 'FailFast', [msg || '']); }

module.exports = {
    getEnvironmentVariable: getEnvironmentVariable,
    setEnvironmentVariable: setEnvironmentVariable,
    getEnvironmentVariables: getEnvironmentVariables,
    getCommandLineArgs: getCommandLineArgs,
    tickCount: tickCount,
    tickCount64: tickCount64,
    osVersion: osVersion,
    processorCount: processorCount,
    workingSet: workingSet,
    is64BitProcess: is64BitProcess,
    is64BitOperatingSystem: is64BitOperatingSystem,
    machineName: machineName,
    userName: userName,
    userDomainName: userDomainName,
    systemDirectory: systemDirectory,
    currentManagedThreadId: currentManagedThreadId,
    newline: newline,
    exit: exit,
    failFast: failFast
};
