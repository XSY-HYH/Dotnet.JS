const dn = require('../dotnet.js');
const Encoding = dn.type('System.Text.Encoding');

// Buffer 类 - 模拟 Node.js Buffer
class Buffer extends Uint8Array {
    constructor(size) {
        super(size);
    }
    
    static from(data, encoding) {
        if (typeof data === 'string') {
            const enc = encoding || 'utf8';
            const bytes = Encoding[enc.toUpperCase()]().GetBytes(data);
            const buf = new Buffer(bytes.length);
            buf.set(bytes);
            return buf;
        }
        if (Array.isArray(data)) {
            const buf = new Buffer(data.length);
            buf.set(data);
            return buf;
        }
        if (data instanceof Uint8Array) {
            const buf = new Buffer(data.length);
            buf.set(data);
            return buf;
        }
        return new Buffer(data);
    }
    
    static alloc(size) {
        return new Buffer(size);
    }
    
    static isBuffer(obj) {
        return obj instanceof Buffer;
    }
    
    // 实例方法
    toString(encoding) {
        const enc = encoding || 'utf8';
        const bytes = Array.from(this);
        return Encoding[enc.toUpperCase()]().GetString(bytes);
    }
}

module.exports = Buffer;