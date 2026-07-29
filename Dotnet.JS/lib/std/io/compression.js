// lib/std/io/compression.js
// Zip 压缩，桥接 System.IO.Compression.ZipFile / ZipArchive
var dn = require('dotnet');
var ZipFile = dn.type('System.IO.Compression.ZipFile');
var ZipArchive = dn.type('System.IO.Compression.ZipArchive');
var ZipArchiveMode = dn.type('System.IO.Compression.ZipArchiveMode');

function createFromDirectory(src, dst, level, includeBase) {
    if (level !== undefined) dn.callStatic(ZipFile, 'CreateFromDirectory', [src, dst, level, includeBase !== false]);
    else dn.callStatic(ZipFile, 'CreateFromDirectory', [src, dst]);
}
function extractToDirectory(zip, dst) { dn.callStatic(ZipFile, 'ExtractToDirectory', [zip, dst]); }
function openRead(zip) { return dn.callStatic(ZipFile, 'OpenRead', [zip]); }
function open(zip, mode) { return dn.callStatic(ZipFile, 'Open', [zip, mode]); }
function getEntries(archive) { return dn.getInstanceProperty(ZipArchive, archive, 'Entries'); }
function getEntry(archive, name) { return dn.callInstance(ZipArchive, archive, 'GetEntry', [name]); }
function createEntry(archive, name) { return dn.callInstance(ZipArchive, archive, 'CreateEntry', [name]); }
function disposeArchive(archive) { dn.callInstance(ZipArchive, archive, 'Dispose', []); }

// ZipArchiveEntry
function getEntryFullName(entry) { return dn.getInstanceProperty(ZipArchive, entry, 'FullName'); }
function getEntryName(entry) { return dn.getInstanceProperty(ZipArchive, entry, 'Name'); }
function getEntryLength(entry) { return dn.getInstanceProperty(ZipArchive, entry, 'Length'); }
function openEntry(entry) { return dn.callInstance(ZipArchive, entry, 'Open', []); }
function deleteEntry(entry) { dn.callInstance(ZipArchive, entry, 'Delete', []); }

function archiveMode(name) { return dn.getProperty(ZipArchiveMode, name); }

module.exports = {
    createFromDirectory: createFromDirectory,
    extractToDirectory: extractToDirectory,
    openRead: openRead,
    open: open,
    getEntries: getEntries,
    getEntry: getEntry,
    createEntry: createEntry,
    disposeArchive: disposeArchive,
    getEntryFullName: getEntryFullName,
    getEntryName: getEntryName,
    getEntryLength: getEntryLength,
    openEntry: openEntry,
    deleteEntry: deleteEntry,
    archiveMode: archiveMode
};
