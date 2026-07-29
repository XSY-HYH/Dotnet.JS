// 外部 DLL 加载测试，确认 logs.dll 依赖解析
function main() {
    var dn = require('dotnet');
    var logs = dn.loadFrom('D:\\Programming\\C#\\AAAAA - CLASS\\logs.dll');
    console.log("程序集名:", logs.name);

    try {
        var types = logs.getTypes();
        console.log("getTypes 成功, 数量:", types.length);
        for (var i = 0; i < types.length; i++) console.log("  -", types[i]);
    } catch (e) {
        console.log("getTypes 失败:", e.message);
    }

    try {
        var Log = dn.getType(logs, 'Logging.Log');
        console.log("getType('Logging.Log'):", Log ? Log.name : "null");
    } catch (e) {
        console.log("getType 失败:", e.message);
    }

    try {
        var LogLevel = dn.getType(logs, 'Logging.LogLevel');
        console.log("getType('Logging.LogLevel'):", LogLevel ? LogLevel.name : "null");
    } catch (e) {
        console.log("getType LogLevel 失败:", e.message);
    }
    return 0;
}
