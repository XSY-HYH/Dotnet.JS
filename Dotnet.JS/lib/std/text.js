// lib/std/text.js
// 编码转换和正则表达式，桥接 System.Text.Encoding + Regex
var dn = require('dotnet');
var Encoding = dn.type('System.Text.Encoding');
var Regex = dn.type('System.Text.RegularExpressions.Regex');
var RegexOptions = dn.type('System.Text.RegularExpressions.RegexOptions');

function utf8() { return dn.getProperty(Encoding, 'UTF8'); }
function unicode() { return dn.getProperty(Encoding, 'Unicode'); }
function ascii() { return dn.getProperty(Encoding, 'ASCII'); }
function utf32() { return dn.getProperty(Encoding, 'UTF32'); }
function getDefault() { return dn.getProperty(Encoding, 'Default'); }

function getBytes(str, encoding) {
    encoding = encoding || utf8();
    return dn.callInstance(Encoding, encoding, 'GetBytes', [str]);
}

function getString(bytes, encoding) {
    encoding = encoding || utf8();
    return dn.callInstance(Encoding, encoding, 'GetString', [bytes]);
}

function getByteCount(str, encoding) {
    encoding = encoding || utf8();
    return dn.callInstance(Encoding, encoding, 'GetByteCount', [str]);
}

function isMatch(input, pattern, options) {
    return options !== undefined
        ? dn.callStatic(Regex, 'IsMatch', [input, pattern, options])
        : dn.callStatic(Regex, 'IsMatch', [input, pattern]);
}

function match(input, pattern, options) {
    return options !== undefined
        ? dn.callStatic(Regex, 'Match', [input, pattern, options])
        : dn.callStatic(Regex, 'Match', [input, pattern]);
}

function matches(input, pattern, options) {
    return options !== undefined
        ? dn.callStatic(Regex, 'Matches', [input, pattern, options])
        : dn.callStatic(Regex, 'Matches', [input, pattern]);
}

function replace(input, pattern, replacement) {
    return dn.callStatic(Regex, 'Replace', [input, pattern, replacement]);
}

function split(input, pattern) {
    return dn.callStatic(Regex, 'Split', [input, pattern]);
}

var regexOptions = {
    none: dn.getProperty(RegexOptions, 'None'),
    ignoreCase: dn.getProperty(RegexOptions, 'IgnoreCase'),
    multiline: dn.getProperty(RegexOptions, 'Multiline'),
    explicitCapture: dn.getProperty(RegexOptions, 'ExplicitCapture'),
    compiled: dn.getProperty(RegexOptions, 'Compiled'),
    singleline: dn.getProperty(RegexOptions, 'Singleline'),
    ignorePatternWhitespace: dn.getProperty(RegexOptions, 'IgnorePatternWhitespace'),
    rightToLeft: dn.getProperty(RegexOptions, 'RightToLeft'),
    ECMAScript: dn.getProperty(RegexOptions, 'ECMAScript'),
    cultureInvariant: dn.getProperty(RegexOptions, 'CultureInvariant')
};

module.exports = {
    utf8: utf8,
    unicode: unicode,
    ascii: ascii,
    utf32: utf32,
    getDefault: getDefault,
    getBytes: getBytes,
    getString: getString,
    getByteCount: getByteCount,
    isMatch: isMatch,
    match: match,
    matches: matches,
    replace: replace,
    split: split,
    regexOptions: regexOptions
};
