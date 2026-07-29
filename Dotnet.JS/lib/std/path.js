// lib/std/path.js
var dn = require('dotnet');
var Path = dn.type('System.IO.Path');

function combine() {
    return dn.callStatic(Path, 'Combine', Array.prototype.slice.call(arguments));
}
function getFullPath(p) { return dn.callStatic(Path, 'GetFullPath', [p]); }
function getFileName(p) { return dn.callStatic(Path, 'GetFileName', [p]); }
function getFileNameWithoutExtension(p) { return dn.callStatic(Path, 'GetFileNameWithoutExtension', [p]); }
function getDirectoryName(p) { return dn.callStatic(Path, 'GetDirectoryName', [p]); }
function getExtension(p) { return dn.callStatic(Path, 'GetExtension', [p]); }
function changeExtension(p, ext) { return dn.callStatic(Path, 'ChangeExtension', [p, ext]); }
function getTempPath() { return dn.callStatic(Path, 'GetTempPath', []); }
function getTempFileName() { return dn.callStatic(Path, 'GetTempFileName', []); }
function hasExtension(p) { return dn.callStatic(Path, 'HasExtension', [p]); }
function isPathRooted(p) { return dn.callStatic(Path, 'IsPathRooted', [p]); }
function getPathRoot(p) { return dn.callStatic(Path, 'GetPathRoot', [p]); }

var directorySeparatorChar = dn.getProperty(Path, 'DirectorySeparatorChar');
var altDirectorySeparatorChar = dn.getProperty(Path, 'AltDirectorySeparatorChar');
var pathSeparator = dn.getProperty(Path, 'PathSeparator');
var volumeSeparatorChar = dn.getProperty(Path, 'VolumeSeparatorChar');

module.exports = {
    combine: combine,
    getFullPath: getFullPath,
    getFileName: getFileName,
    getFileNameWithoutExtension: getFileNameWithoutExtension,
    getDirectoryName: getDirectoryName,
    getExtension: getExtension,
    changeExtension: changeExtension,
    getTempPath: getTempPath,
    getTempFileName: getTempFileName,
    hasExtension: hasExtension,
    isPathRooted: isPathRooted,
    getPathRoot: getPathRoot,
    directorySeparatorChar: directorySeparatorChar,
    altDirectorySeparatorChar: altDirectorySeparatorChar,
    pathSeparator: pathSeparator,
    volumeSeparatorChar: volumeSeparatorChar
};
