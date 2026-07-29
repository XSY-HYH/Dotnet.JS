// lib/std/net/dns.js
// DNS 解析，桥接 System.Net.Dns
var dn = require('dotnet');
var Dns = dn.type('System.Net.Dns');

function getHostName() { return dn.callStatic(Dns, 'GetHostName', []); }
function getHostAddresses(host) { return dn.callStatic(Dns, 'GetHostAddresses', [host]); }
function getHostEntry(host) { return dn.callStatic(Dns, 'GetHostEntry', [host]); }
function getHostEntryAsync(host) { return dn.callStatic(Dns, 'GetHostEntryAsync', [host]); }

module.exports = {
    getHostName: getHostName,
    getHostAddresses: getHostAddresses,
    getHostEntry: getHostEntry,
    getHostEntryAsync: getHostEntryAsync
};
