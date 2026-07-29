function main(args) {
    console.log("=== 扩展标准库测试 ===");

    var thread = require('std/thread');
    var sw0 = require('std/diagnostics').startNew();
    thread.sleep(300);
    var ms = require('std/diagnostics').elapsedMilliseconds(sw0);
    console.log("thread.sleep(300) 实际耗时:", ms, "ms (期望 >= 300)");

    var guid = require('std/guid');
    var g = guid.newGuid();
    console.log("guid.newGuid:", g);
    console.log("guid.parse:", guid.parse(g));
    console.log("guid.empty:", guid.empty());

    var convert = require('std/convert');
    var bytes = [104, 105];
    var b64 = convert.toBase64(bytes);
    console.log("convert.toBase64([104,105]):", b64, "(期望 aGk=)");
    console.log("convert.fromBase64('aGk='):", convert.fromBase64(b64), "(期望 104,105)");
    console.log("convert.toHexString([255,0,15]):", convert.toHexString([255, 0, 15]), "(期望 ff000f)");
    console.log("convert.toInt32('42'):", convert.toInt32('42'));

    var crypto = require('std/crypto');
    var hash = crypto.sha256([104, 105]);
    console.log("crypto.sha256([104,105]):", hash, "(长度期望 32)");

    var uri = require('std/uri');
    console.log("uri.urlEncode('a b&c'):", uri.urlEncode('a b&c'));
    console.log("uri.urlDecode:", uri.urlDecode(uri.urlEncode('a b&c')));
    console.log("uri.htmlEncode('<b>'):", uri.htmlEncode('<b>'));
    console.log("uri.escapeDataString('a b'):", uri.escapeDataString('a b'));

    var random = require('std/random');
    console.log("random.next():", random.next());
    console.log("random.next(10):", random.next(10));
    console.log("random.next(5, 10):", random.next(5, 10));
    console.log("random.nextDouble():", random.nextDouble());

    var diag = require('std/diagnostics');
    var sw = diag.startNew();
    for (var i = 0; i < 100000; i++) { }
    diag.stop(sw);
    console.log("diag.elapsedMilliseconds:", diag.elapsedMilliseconds(sw));
    console.log("diag.frequency:", diag.frequency());
    console.log("diag.isHighResolution:", diag.isHighResolution());

    var cur = diag.getCurrentProcess();
    console.log("diag.getId(cur):", diag.getId(cur));
    console.log("diag.getProcessName(cur):", diag.getProcessName(cur));

    console.log("=== 扩展标准库测试通过 ===");
    return 0;
}
