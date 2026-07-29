// lib/std/node/buffer.js
const dn = require('../dotnet.js');

// ✅ 兼容 Jint
var root = (typeof global !== 'undefined') ? global :
           (typeof window !== 'undefined') ? window :
           (typeof this !== 'undefined') ? this :
           {};

function Buffer(size) {
    if (!(this instanceof Buffer)) {
        return new Buffer(size);
    }
    if (typeof size === 'number') {
        this._data = new Array(size).fill(0);
    } else if (typeof size === 'string') {
        this._data = [];
        for (var i = 0; i < size.length; i++) {
            this._data.push(size.charCodeAt(i));
        }
    } else if (Array.isArray(size)) {
        this._data = size.slice();
    } else if (size && size._data) {
        this._data = size._data.slice();
    } else {
        this._data = [];
    }
    this.length = this._data.length;
}

Buffer.from = function(data, encoding) {
    if (typeof data === 'string') {
        var buf = new Buffer(0);
        if (encoding === 'hex') {
            // 十六进制解码
            var bytes = [];
            for (var i = 0; i < data.length; i += 2) {
                bytes.push(parseInt(data.substr(i, 2), 16));
            }
            buf._data = bytes;
        } else {
            // UTF-8
            buf._data = [];
            for (var i = 0; i < data.length; i++) {
                buf._data.push(data.charCodeAt(i));
            }
        }
        buf.length = buf._data.length;
        return buf;
    }
    if (Array.isArray(data)) {
        var buf = new Buffer(0);
        buf._data = data.slice();
        buf.length = buf._data.length;
        return buf;
    }
    if (data && data._data) {
        var buf = new Buffer(0);
        buf._data = data._data.slice();
        buf.length = buf._data.length;
        return buf;
    }
    return new Buffer(0);
};

Buffer.alloc = function(size) {
    return new Buffer(size);
};

Buffer.isBuffer = function(obj) {
    return obj && obj._data !== undefined;
};

Buffer.prototype.toString = function(encoding) {
    var result = '';
    for (var i = 0; i < this._data.length; i++) {
        result += String.fromCharCode(this._data[i]);
    }
    return result;
};

Buffer.prototype.toJSON = function() {
    return this._data;
};

// 挂载到全局
if (!root.Buffer) {
    root.Buffer = Buffer;
}

module.exports = Buffer;