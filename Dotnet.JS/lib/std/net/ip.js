// lib/std/net/ip.js
// IP 地址，桥接 System.Net.IPAddress
var dn = require('dotnet');
var IPAddress = dn.type('System.Net.IPAddress');

function parse(s) { return dn.callStatic(IPAddress, 'Parse', [s]); }
function tryParse(s) {
    try { return dn.callStatic(IPAddress, 'Parse', [s]); }
    catch (e) { return null; }
}
function any() { return dn.getProperty(IPAddress, 'Any'); }
function loopback() { return dn.getProperty(IPAddress, 'Loopback'); }
function broadcast() { return dn.getProperty(IPAddress, 'Broadcast'); }
function ipv6Any() { return dn.getProperty(IPAddress, 'IPv6Any'); }
function ipv6Loopback() { return dn.getProperty(IPAddress, 'IPv6Loopback'); }
function ipv6None() { return dn.getProperty(IPAddress, 'IPv6None'); }
function none() { return dn.getProperty(IPAddress, 'None'); }
function getAddressBytes(ip) { return dn.callInstance(IPAddress, ip, 'GetAddressBytes', []); }
function toString(ip) { return dn.callInstance(IPAddress, ip, 'ToString', []); }
function isLoopback(ipAddr) { return dn.callStatic(IPAddress, 'IsLoopback', [ipAddr]); }
function getAddressFamily(ip) { return dn.getInstanceProperty(IPAddress, ip, 'AddressFamily'); }

module.exports = {
    parse: parse,
    tryParse: tryParse,
    any: any,
    loopback: loopback,
    broadcast: broadcast,
    ipv6Any: ipv6Any,
    ipv6Loopback: ipv6Loopback,
    ipv6None: ipv6None,
    none: none,
    getAddressBytes: getAddressBytes,
    toString: toString,
    isLoopback: isLoopback,
    getAddressFamily: getAddressFamily
};
