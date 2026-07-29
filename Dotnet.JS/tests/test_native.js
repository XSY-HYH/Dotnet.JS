// native 调用测试，用不弹窗的 kernel32 函数
function main() {
    var k = __native_load('kernel32.dll');
    console.log("kernel32:", k ? k.toString() : "FAIL");

    var gtc = __native_get_proc(k, 'GetTickCount');
    var tc = __native_call(gtc, [], [], 'int');
    console.log("GetTickCount:", tc, "(应为大整数)");

    var ls = __native_get_proc(k, 'lstrlenW');
    var len = __native_call(ls, ['wstring'], ['hello'], 'int');
    console.log("lstrlenW('hello'):", len, "(期望 5)");

    var lsA = __native_get_proc(k, 'lstrlenA');
    var lenA = __native_call(lsA, ['string'], ['hello'], 'int');
    console.log("lstrlenA('hello'):", lenA, "(期望 5)");

    // 带中文的宽字符串
    var lenZh = __native_call(ls, ['wstring'], ['你好世界'], 'int');
    console.log("lstrlenW('你好世界'):", lenZh, "(期望 4)");

    var gle = __native_get_proc(k, 'GetLastError');
    var le = __native_call(gle, [], [], 'int');
    console.log("GetLastError:", le);

    console.log("=== native 测试通过 ===");
    return 0;
}
