// lib/std/sql.js
// SQL 数据库访问，桥接 System.Data.Common，驱动 dll 放 lib/ncl/ 由 loadDriver 加载
var dn = require('dotnet');
dn.load('System.Data.Common');
var DbConnection = dn.type('System.Data.Common.DbConnection');
var DbCommand = dn.type('System.Data.Common.DbCommand');
var DbParameter = dn.type('System.Data.Common.DbParameter');
var DbDataReader = dn.type('System.Data.Common.DbDataReader');
var DbParameterCollection = dn.type('System.Data.Common.DbParameterCollection');

// 加载数据库驱动 dll（从 lib/ncl/）
function loadDriver(dllName) {
    var path = require('std/path');
    var app = require('std/app');
    var nclDir = path.combine(path.combine(app.baseDirectory(), 'lib'), 'ncl');
    return dn.loadFrom(path.combine(nclDir, dllName));
}

// 用 DbProviderFactory 打开连接，factoryTypeName 如 'Microsoft.Data.Sqlite.SqliteFactory'
function open(factoryTypeName, connectionString) {
    var factory = dn.type(factoryTypeName);
    var factoryInstance = dn.getProperty(factory, 'Instance');
    var conn = dn.callInstance(factory, factoryInstance, 'CreateConnection', []);
    dn.callInstance(DbConnection, conn, 'set_ConnectionString', [connectionString]);
    dn.callInstance(DbConnection, conn, 'Open', []);
    return conn;
}

function createCommand(conn, sql, params) {
    var cmd = dn.callInstance(DbConnection, conn, 'CreateCommand', []);
    dn.callInstance(DbCommand, cmd, 'set_CommandText', [sql]);
    if (params) {
        var parameters = dn.getInstanceProperty(DbCommand, cmd, 'Parameters');
        for (var i = 0; i < params.length; i++) {
            var p = dn.callInstance(DbCommand, cmd, 'CreateParameter', []);
            dn.callInstance(DbParameter, p, 'set_Value', [params[i]]);
            dn.callInstance(DbParameterCollection, parameters, 'Add', [p]);
        }
    }
    return cmd;
}

// 查询返回行数组，每行为 {列名: 值}
function query(conn, sql, params) {
    var cmd = createCommand(conn, sql, params);
    var reader = dn.callInstance(DbCommand, cmd, 'ExecuteReader', []);
    var rows = [];
    while (dn.callInstance(DbDataReader, reader, 'Read', [])) {
        var row = {};
        var fieldCount = dn.getInstanceProperty(DbDataReader, reader, 'FieldCount');
        for (var i = 0; i < fieldCount; i++) {
            var name = dn.callInstance(DbDataReader, reader, 'GetName', [i]);
            var value = dn.callInstance(DbDataReader, reader, 'GetValue', [i]);
            row[name] = value;
        }
        rows.push(row);
    }
    dn.callInstance(DbDataReader, reader, 'Close', []);
    return rows;
}

// 执行非查询，返回受影响行数
function exec(conn, sql, params) {
    var cmd = createCommand(conn, sql, params);
    return dn.callInstance(DbCommand, cmd, 'ExecuteNonQuery', []);
}

// 执行返回单值
function scalar(conn, sql, params) {
    var cmd = createCommand(conn, sql, params);
    return dn.callInstance(DbCommand, cmd, 'ExecuteScalar', []);
}

function close(conn) {
    dn.callInstance(DbConnection, conn, 'Close', []);
}

module.exports = {
    loadDriver: loadDriver,
    open: open,
    query: query,
    exec: exec,
    scalar: scalar,
    close: close
};
