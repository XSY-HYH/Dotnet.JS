function main(args) {
    console.log("=== 测试 JS 标准库 ===");

    // console
    console.log("console.log 多参数:", 1, "two", { a: 1 });
    console.warn("console.warn");
    console.error("console.error");

    // fs
    var fs = require('std/fs');
    fs.writeFile("test_std_output.txt", "hello from std/fs");
    var content = fs.readFile("test_std_output.txt");
    console.log("fs.readFile:", content, "(期望 hello from std/fs)");
    if (content !== "hello from std/fs") {
        console.error("FAIL: fs 读写失败");
        return 1;
    }
    console.log("fs.exists:", fs.exists("test_std_output.txt"));
    fs.delete("test_std_output.txt");
    console.log("fs.exists 删除后:", fs.exists("test_std_output.txt"));

    // path
    var path = require('std/path');
    var joined = path.join("a", "b", "c");
    console.log("path.join:", joined);
    console.log("path.basename:", path.basename("/foo/bar.txt"));
    console.log("path.dirname:", path.dirname("/foo/bar.txt"));
    console.log("path.extname:", path.extname("/foo/bar.txt"));
    console.log("path.separator:", JSON.stringify(path.separator));

    // os
    var os = require('std/os');
    console.log("os.platform:", os.platform());
    console.log("os.hostname:", os.hostname());
    console.log("os.tmpdir:", os.tmpdir());
    console.log("os.homedir:", os.homedir());

    // process
    console.log("process.argv:", JSON.stringify(process.argv));
    console.log("process.cwd:", process.cwd());
    console.log("process.pid:", process.pid);

    console.log("=== JS 标准库测试通过 ===");
    return 0;
}
