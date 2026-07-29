// lib/std/fs.js
var dn = require('dotnet');
var File = dn.type('System.IO.File');
var Directory = dn.type('System.IO.Directory');

function readAllText(path) { return dn.callStatic(File, 'ReadAllText', [path]); }
function readAllLines(path) { return dn.callStatic(File, 'ReadAllLines', [path]); }
function readAllBytes(path) { return dn.callStatic(File, 'ReadAllBytes', [path]); }

function writeAllText(path, content) { dn.callStatic(File, 'WriteAllText', [path, content]); }
function writeAllLines(path, lines) { dn.callStatic(File, 'WriteAllLines', [path, lines]); }
function writeAllBytes(path, bytes) { dn.callStatic(File, 'WriteAllBytes', [path, bytes]); }

function appendAllText(path, content) { dn.callStatic(File, 'AppendAllText', [path, content]); }
function appendAllLines(path, lines) { dn.callStatic(File, 'AppendAllLines', [path, lines]); }

function exists(path) { return dn.callStatic(File, 'Exists', [path]); }
function remove(path) { dn.callStatic(File, 'Delete', [path]); }
function copy(src, dst, overwrite) { dn.callStatic(File, 'Copy', [src, dst, overwrite !== false]); }
function move(src, dst) { dn.callStatic(File, 'Move', [src, dst]); }

function getCreationTime(path) { return dn.callStatic(File, 'GetCreationTime', [path]); }
function getLastWriteTime(path) { return dn.callStatic(File, 'GetLastWriteTime', [path]); }
function getLastAccessTime(path) { return dn.callStatic(File, 'GetLastAccessTime', [path]); }
function setCreationTime(path, time) { dn.callStatic(File, 'SetCreationTime', [path, time]); }
function setLastWriteTime(path, time) { dn.callStatic(File, 'SetLastWriteTime', [path, time]); }

function getFiles(path, pattern) {
    return pattern ? dn.callStatic(Directory, 'GetFiles', [path, pattern])
                    : dn.callStatic(Directory, 'GetFiles', [path]);
}
function getDirectories(path, pattern) {
    return pattern ? dn.callStatic(Directory, 'GetDirectories', [path, pattern])
                    : dn.callStatic(Directory, 'GetDirectories', [path]);
}
function createDirectory(path) { dn.callStatic(Directory, 'CreateDirectory', [path]); }
function deleteDirectory(path, recursive) { dn.callStatic(Directory, 'Delete', [path, recursive === true]); }
function directoryExists(path) { return dn.callStatic(Directory, 'Exists', [path]); }
function getCurrentDirectory() { return dn.callStatic(Directory, 'GetCurrentDirectory', []); }
function setCurrentDirectory(path) { dn.callStatic(Directory, 'SetCurrentDirectory', [path]); }

module.exports = {
    readAllText: readAllText,
    readAllLines: readAllLines,
    readAllBytes: readAllBytes,
    writeAllText: writeAllText,
    writeAllLines: writeAllLines,
    writeAllBytes: writeAllBytes,
    appendAllText: appendAllText,
    appendAllLines: appendAllLines,
    exists: exists,
    remove: remove,
    copy: copy,
    move: move,
    getCreationTime: getCreationTime,
    getLastWriteTime: getLastWriteTime,
    getLastAccessTime: getLastAccessTime,
    setCreationTime: setCreationTime,
    setLastWriteTime: setLastWriteTime,
    getFiles: getFiles,
    getDirectories: getDirectories,
    createDirectory: createDirectory,
    deleteDirectory: deleteDirectory,
    directoryExists: directoryExists,
    getCurrentDirectory: getCurrentDirectory,
    setCurrentDirectory: setCurrentDirectory
};
