function main(args) {
    console.log("=== 扩展标准库测试2 ===");

    // text_builder
    var sb = require('std/text_builder');
    var b = sb.create();
    sb.append(b, "hello");
    sb.appendLine(b, " world");
    sb.appendFormat(b, "{0}={1}", ["key", 42]);
    console.log("text_builder.toString:", sb.toString(b));
    console.log("text_builder.length:", sb.getLength(b));

    // math
    var math = require('std/math');
    console.log("math.clamp(5, 0, 3):", math.clamp(5, 0, 3), "(期望 3)");
    console.log("math.clamp(-1, 0, 3):", math.clamp(-1, 0, 3), "(期望 0)");
    console.log("math.cbrt(27):", math.cbrt(27), "(期望 3)");
    console.log("math.log2(8):", math.log2(8), "(期望 3)");
    console.log("math.sign(-5):", math.sign(-5), "(期望 -1)");
    console.log("math.bigMul(1000000, 1000000):", math.bigMul(1000000, 1000000));
    console.log("math.divRem(17, 5):", JSON.stringify(math.divRem(17, 5)), "(期望 quotient=3,remainder=2)");
    console.log("math.acosh(1):", math.acosh(1), "(期望 0)");

    // bit_converter
    var bp = require('std/bit_converter');
    console.log("bit_converter.isLittleEndian:", bp.isLittleEndian());
    console.log("bit_converter.toString([1,2,3]):", bp.toString([1, 2, 3]));
    console.log("bit_converter.toInt32([1,0,0,0]):", bp.toInt32([1, 0, 0, 0]), "(期望 1 LE)");
    console.log("bit_converter.doubleToInt64Bits(1.0):", bp.doubleToInt64Bits(1.0));
    console.log("bit_converter.int64BitsToDouble:", bp.int64BitsToDouble(bp.doubleToInt64Bits(1.0)));

    // gc
    var gc = require('std/gc');
    console.log("gc.maxGeneration:", gc.maxGeneration());
    console.log("gc.getTotalMemory(false):", gc.getTotalMemory(false));
    gc.collect();
    gc.waitForPendingFinalizers();
    console.log("gc.collect 完成");

    // app
    var app = require('std/app');
    console.log("app.getTargetFrameworkName:", app.getTargetFrameworkName());
    console.log("app.baseDirectory:", app.baseDirectory());

    // globalization
    var glob = require('std/globalization');
    var cur = glob.getCurrentCulture();
    console.log("globalization.currentCulture.name:", glob.getName(cur));
    console.log("globalization.currentCulture.displayName:", glob.getDisplayName(cur));
    var inv = glob.invariantCulture();
    console.log("globalization.invariant.name:", glob.getName(inv));
    var zh = glob.getCulture('zh-CN');
    console.log("globalization.getCulture('zh-CN').displayName:", zh ? glob.getDisplayName(zh) : "FAIL");

    // net/ip 先加载，dns 测试要用 ip.toString
    var ip = require('std/net/ip');

    // net/dns
    var dns = require('std/net/dns');
    console.log("dns.getHostName:", dns.getHostName());
    var addrs = dns.getHostAddresses('localhost');
    var addrStrs = [];
    for (var i = 0; i < addrs.length; i++) addrStrs.push(ip.toString(addrs[i]));
    console.log("dns.getHostAddresses('localhost'):", addrStrs.join(","));

    // net/ip
    var loopback = ip.loopback();
    console.log("ip.loopback:", loopback ? ip.toString(loopback) : "FAIL");
    var parsed = ip.parse('127.0.0.1');
    console.log("ip.parse('127.0.0.1'):", parsed ? ip.toString(parsed) : "FAIL");
    console.log("ip.isLoopback(parsed):", parsed ? ip.isLoopback(parsed) : "FAIL");
    console.log("ip.any:", ip.toString(ip.any()));

    // io/stream
    var fs = require('std/fs');
    var stream = require('std/io/stream');
    fs.writeAllText("test_stream.txt", "line1\nline2\n");
    var r = stream.readerFromFile("test_stream.txt");
    console.log("stream.readLine:", stream.readLine(r));
    console.log("stream.readToEnd:", stream.readToEnd(r));
    stream.closeReader(r);

    var ms = stream.memoryStream();
    stream.writeByte(ms, 65);
    stream.writeByte(ms, 66);
    stream.writeByte(ms, 67);
    console.log("stream.memoryStream.toArray:", stream.toArray(ms), "(期望 65,66,67)");

    // 写流测试
    var w = stream.writerFromFile("test_stream_w.txt", false);
    stream.writeLine(w, "hello");
    stream.writeLine(w, "world");
    stream.closeWriter(w);
    console.log("stream写入后读取:", fs.readAllText("test_stream_w.txt").replace(/\n/g, "\\n"));
    fs.remove("test_stream.txt");
    fs.remove("test_stream_w.txt");

    // xml
    var xml = require('std/xml');
    var doc = xml.parseXml('<root><item id="1">hello</item><item id="2">world</item></root>');
    var root = xml.getDocumentElement(doc);
    console.log("xml.root.name:", xml.getNodeName(root));
    var nodes = xml.selectNodes(root, '//item');
    console.log("xml.selectNodes('//item'):", nodes);
    console.log("xml.outerXml:", xml.getOuterXml(root).substring(0, 50) + "...");

    // tasks
    var tasks = require('std/tasks');
    var sw = require('std/diagnostics').startNew();
    tasks.delay(200);
    var ms2 = require('std/diagnostics').elapsedMilliseconds(sw);
    console.log("tasks.delay(200) 实际:", ms2, "ms (期望 >= 200)");

    // crypto 扩展
    var crypto = require('std/crypto');
    var key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    var hmac = crypto.hmacSha256(key, [104, 105]);
    console.log("crypto.hmacSha256 长度:", hmac.length, "(期望 32)");
    var rb = crypto.randomBytes(8);
    console.log("crypto.randomBytes(8) 长度:", rb.length, "(期望 8)");
    console.log("crypto.randomInt32(0, 100):", crypto.randomInt32(0, 100));

    // io/compression
    var zip = require('std/io/compression');
    fs.createDirectory("test_zip_src");
    fs.writeAllText("test_zip_src/a.txt", "aaa");
    fs.writeAllText("test_zip_src/b.txt", "bbb");
    zip.createFromDirectory("test_zip_src", "test_zip.zip");
    console.log("zip.createFromDirectory 完成, exists:", fs.exists("test_zip.zip"));
    zip.extractToDirectory("test_zip.zip", "test_zip_dst");
    console.log("zip.extractToDirectory 完成, a.txt:", fs.readAllText("test_zip_dst/a.txt"));
    var archive = zip.openRead("test_zip.zip");
    var entries = zip.getEntries(archive);
    console.log("zip.entries count:", entries.length);
    zip.disposeArchive(archive);
    fs.remove("test_zip_src/a.txt");
    fs.remove("test_zip_src/b.txt");
    fs.remove("test_zip.zip");
    fs.remove("test_zip_dst/a.txt");
    fs.remove("test_zip_dst/b.txt");

    // diagnostics Trace/Debug
    var diag = require('std/diagnostics');
    diag.traceInformation("test trace info");
    diag.traceWarning("test trace warn");
    diag.debugWrite("test debug");
    console.log("trace/debug 调用完成");

    console.log("=== 扩展标准库测试2 通过 ===");
    return 0;
}
