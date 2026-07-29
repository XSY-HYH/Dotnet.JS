function main(args) {
    console.log("=== 测试 callStatic 数组传参 bug 修复 ===");

    var coreLib = __load_assembly('System.Private.CoreLib');
    var File = coreLib.getType('System.IO.File');

    // 旧 bug 触发场景：数组传参应该正确返回 false 而不是 null
    var result1 = File.callStatic('Exists', ['nonexistent.txt']);
    console.log("数组传参 File.Exists('nonexistent.txt') =", result1, "(期望 false)");
    if (result1 !== false) {
        console.error("FAIL: 数组传参 bug 未修复");
        return 1;
    }

    // 直接多参数也应工作
    var result2 = File.callStatic('Exists', 'nonexistent.txt');
    console.log("直接传参 File.Exists('nonexistent.txt') =", result2, "(期望 false)");
    if (result2 !== false) {
        console.error("FAIL: 直接传参失败");
        return 1;
    }

    // 找不到方法应抛异常不再返回 null
    try {
        File.callStatic('NoSuchMethod', 'arg');
        console.error("FAIL: 应该抛异常但没抛");
        return 1;
    } catch (e) {
        console.log("找不到方法抛异常:", e.message);
    }

    // 多参数重载
    var Path = coreLib.getType('System.IO.Path');
    var combined = Path.callStatic('Combine', 'a', 'b', 'c');
    console.log("Path.Combine('a','b','c') =", combined);
    if (combined !== "a/b/c" && combined !== "a\\b\\c") {
        console.error("FAIL: Path.Combine 结果异常:", combined);
        return 1;
    }

    // 数值参数重载
    var Math = coreLib.getType('System.Math');
    var maxVal = Math.callStatic('Max', 3, 7);
    console.log("Math.Max(3, 7) =", maxVal, "(期望 7)");
    if (maxVal !== 7) {
        console.error("FAIL: Math.Max 数值重载失败");
        return 1;
    }

    console.log("=== 所有 callStatic 测试通过 ===");
    return 0;
}
