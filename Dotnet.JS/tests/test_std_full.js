function main(args) {
    console.log("=== 测试 JS 标准库（C# 风格）===");

    // dotnet 底层
    var dn = require('dotnet');
    var Console = dn.type('System.Console');
    console.log("dn.type('System.Console') =", Console ? "OK" : "FAIL");
    if (!Console) return 1;

    // fs
    var fs = require('std/fs');
    fs.writeAllText("test_std_full.txt", "hello");
    var content = fs.readAllText("test_std_full.txt");
    console.log("fs.readAllText:", content, "(期望 hello)");
    if (content !== "hello") { console.error("FAIL: fs 读写失败"); return 1; }
    console.log("fs.exists:", fs.exists("test_std_full.txt"));
    console.log("fs.getFiles:", fs.getFiles("."));
    fs.remove("test_std_full.txt");
    console.log("fs.exists 删除后:", fs.exists("test_std_full.txt"));

    // path
    var path = require('std/path');
    console.log("path.combine:", path.combine("a", "b", "c"));
    console.log("path.getFileName:", path.getFileName("/foo/bar.txt"));
    console.log("path.getExtension:", path.getExtension("/foo/bar.txt"));
    console.log("path.directorySeparatorChar:", JSON.stringify(path.directorySeparatorChar));

    // os
    var os = require('std/os');
    console.log("os.tickCount:", os.tickCount());
    console.log("os.processorCount:", os.processorCount());
    console.log("os.machineName:", os.machineName());
    console.log("os.getEnvironmentVariable('PATH'):", os.getEnvironmentVariable('PATH') ? "OK" : "FAIL");

    // text
    var text = require('std/text');
    var bytes = text.getBytes("hello");
    console.log("text.getBytes('hello'):", bytes, "(期望 104,101,108,108,111)");
    var str = text.getString(bytes);
    console.log("text.getString:", str, "(期望 hello)");
    console.log("text.isMatch('hello world', 'world'):", text.isMatch('hello world', 'world'));
    console.log("text.replace('hello world', 'world', 'JS'):", text.replace('hello world', 'world', 'JS'));

    // time
    var time = require('std/time');
    var now = time.now();
    console.log("time.now():", time.toString(now));
    console.log("time.now() 格式化:", time.toString(now, 'yyyy-MM-dd'));
    var parsed = time.parse('2026-01-15');
    console.log("time.parse('2026-01-15'):", time.toString(parsed, 'yyyy/MM/dd'));
    console.log("time.daysInMonth(2026, 2):", time.daysInMonth(2026, 2));
    console.log("time.isLeapYear(2026):", time.isLeapYear(2026));
    var ts = time.fromDays(1);
    console.log("time.fromDays(1).toString:", time.toStringTs(ts));

    // json
    var json = require('std/json');
    var obj = { name: "test", value: 42, items: [1, 2, 3] };
    var jsonStr = json.serialize(obj);
    console.log("json.serialize:", jsonStr);

    // process
    console.log("process.argv:", JSON.stringify(process.argv));

    console.log("=== JS 标准库测试通过 ===");
    return 0;
}
