// lib/std/process.js
// process.argv 由 host 设置全局 __argv，这里用 getter 读取避免缓存
Object.defineProperty(exports, 'argv', {
    get: function() {
        return typeof __argv !== 'undefined' ? __argv : [];
    }
});

Object.defineProperty(exports, 'argv0', {
    get: function() {
        return (typeof __argv !== 'undefined' && __argv.length > 0) ? __argv[0] : 'Dotnet.JS';
    }
});
