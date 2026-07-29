// lib/std/io/stream.js
// 流式读写，桥接 System.IO.Stream / StreamReader / StreamWriter / MemoryStream
var dn = require('dotnet');
var Stream = dn.type('System.IO.Stream');
var File = dn.type('System.IO.File');
var MemoryStream = dn.type('System.IO.MemoryStream');
var StreamReader = dn.type('System.IO.StreamReader');
var StreamWriter = dn.type('System.IO.StreamWriter');
var FileMode = dn.type('System.IO.FileMode');
var FileAccess = dn.type('System.IO.FileAccess');

// 工厂
function memoryStream() { return dn.createInstance(MemoryStream, []); }
function openRead(path) { return dn.callStatic(File, 'OpenRead', [path]); }
function openWrite(path) { return dn.callStatic(File, 'OpenWrite', [path]); }
function open(path, mode, access) {
    if (access !== undefined) return dn.callStatic(File, 'Open', [path, mode, access]);
    if (mode !== undefined) return dn.callStatic(File, 'Open', [path, mode]);
    return dn.callStatic(File, 'Open', [path]);
}
function reader(stream) { return dn.createInstance(StreamReader, [stream]); }
function writer(stream) { return dn.createInstance(StreamWriter, [stream]); }
function readerFromFile(path) { return dn.createInstance(StreamReader, [path]); }
function writerFromFile(path, append) {
    return dn.createInstance(StreamWriter, [path, append === true]);
}

// Stream 操作
function read(stream, buffer, offset, count) {
    return dn.callInstance(Stream, stream, 'Read', [buffer, offset, count]);
}
function write(stream, buffer, offset, count) {
    dn.callInstance(Stream, stream, 'Write', [buffer, offset, count]);
}
function flush(stream) { dn.callInstance(Stream, stream, 'Flush', []); }
function getPosition(stream) { return dn.getInstanceProperty(Stream, stream, 'Position'); }
function setPosition(stream, pos) { dn.setInstanceProperty(Stream, stream, 'Position', pos); }
function getLength(stream) { return dn.getInstanceProperty(Stream, stream, 'Length'); }
function setLength(stream, len) { dn.setInstanceProperty(Stream, stream, 'Length', len); }
function closeStream(stream) { dn.callInstance(Stream, stream, 'Close', []); }
function disposeStream(stream) { dn.callInstance(Stream, stream, 'Dispose', []); }
function canRead(stream) { return dn.getInstanceProperty(Stream, stream, 'CanRead'); }
function canWrite(stream) { return dn.getInstanceProperty(Stream, stream, 'CanWrite'); }
function canSeek(stream) { return dn.getInstanceProperty(Stream, stream, 'CanSeek'); }

// StreamReader
function readLine(r) { return dn.callInstance(StreamReader, r, 'ReadLine', []); }
function readToEnd(r) { return dn.callInstance(StreamReader, r, 'ReadToEnd', []); }
function closeReader(r) { dn.callInstance(StreamReader, r, 'Close', []); }

// StreamWriter
function writeStr(w, s) { dn.callInstance(StreamWriter, w, 'Write', [s]); }
function writeLine(w, s) { dn.callInstance(StreamWriter, w, 'WriteLine', [s]); }
function flushWriter(w) { dn.callInstance(StreamWriter, w, 'Flush', []); }
function closeWriter(w) { dn.callInstance(StreamWriter, w, 'Close', []); }

// MemoryStream 特有
function toArray(ms) { return dn.callInstance(MemoryStream, ms, 'ToArray', []); }
function writeByte(ms, b) { dn.callInstance(MemoryStream, ms, 'WriteByte', [b]); }
function readByte(ms) { return dn.callInstance(MemoryStream, ms, 'ReadByte', []); }
function writeTo(ms, dest, offset, count) {
    dn.callInstance(MemoryStream, ms, 'WriteTo', [dest, offset, count]);
}

// 枚举值
function fileMode(name) { return dn.getProperty(FileMode, name); }
function fileAccess(name) { return dn.getProperty(FileAccess, name); }

module.exports = {
    memoryStream: memoryStream,
    openRead: openRead,
    openWrite: openWrite,
    open: open,
    reader: reader,
    writer: writer,
    readerFromFile: readerFromFile,
    writerFromFile: writerFromFile,
    read: read,
    write: write,
    flush: flush,
    getPosition: getPosition,
    setPosition: setPosition,
    getLength: getLength,
    setLength: setLength,
    closeStream: closeStream,
    disposeStream: disposeStream,
    canRead: canRead,
    canWrite: canWrite,
    canSeek: canSeek,
    readLine: readLine,
    readToEnd: readToEnd,
    closeReader: closeReader,
    writeStr: writeStr,
    writeLine: writeLine,
    flushWriter: flushWriter,
    closeWriter: closeWriter,
    toArray: toArray,
    writeByte: writeByte,
    readByte: readByte,
    writeTo: writeTo,
    fileMode: fileMode,
    fileAccess: fileAccess
};
