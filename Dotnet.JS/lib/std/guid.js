// lib/std/guid.js
// GUID 生成与解析，桥接 System.Guid
var dn = require('dotnet');
var Guid = dn.type('System.Guid');

function newGuid() { return dn.callStatic(Guid, 'NewGuid', []); }
function parse(s) { return dn.callStatic(Guid, 'Parse', [s]); }
function parseExact(s, format) { return dn.callStatic(Guid, 'ParseExact', [s, format]); }
function tryParse(s) {
    try { return dn.callStatic(Guid, 'Parse', [s]); }
    catch (e) { return null; }
}
function empty() { return dn.getProperty(Guid, 'Empty'); }

module.exports = {
    newGuid: newGuid,
    parse: parse,
    parseExact: parseExact,
    tryParse: tryParse,
    empty: empty
};
