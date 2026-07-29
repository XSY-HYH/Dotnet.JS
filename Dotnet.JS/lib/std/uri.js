// lib/std/uri.js
// URL 与 HTML 编解码，桥接 System.Net.WebUtility / System.Uri
var dn = require('dotnet');
var WebUtility = dn.type('System.Net.WebUtility');
var Uri = dn.type('System.Uri');

function urlEncode(str) { return dn.callStatic(WebUtility, 'UrlEncode', [str]); }
function urlDecode(str) { return dn.callStatic(WebUtility, 'UrlDecode', [str]); }
function htmlEncode(str) { return dn.callStatic(WebUtility, 'HtmlEncode', [str]); }
function htmlDecode(str) { return dn.callStatic(WebUtility, 'HtmlDecode', [str]); }
function escapeDataString(str) { return dn.callStatic(Uri, 'EscapeDataString', [str]); }
function unescapeDataString(str) { return dn.callStatic(Uri, 'UnescapeDataString', [str]); }
function escapeUriString(str) { return dn.callStatic(Uri, 'EscapeUriString', [str]); }
function isWellFormedUriString(str, kind) { return dn.callStatic(Uri, 'IsWellFormedUriString', [str, kind || 1]); }

module.exports = {
    urlEncode: urlEncode,
    urlDecode: urlDecode,
    htmlEncode: htmlEncode,
    htmlDecode: htmlDecode,
    escapeDataString: escapeDataString,
    unescapeDataString: unescapeDataString,
    escapeUriString: escapeUriString,
    isWellFormedUriString: isWellFormedUriString
};
