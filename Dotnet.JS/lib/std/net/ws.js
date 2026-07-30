// lib/std/net/ws.js
// WebSocket 客户端，桥接 System.Net.WebSockets.ClientWebSocket
var dn = require('dotnet');
dn.load('System.Net.WebSockets');
var ClientWebSocket = dn.type('System.Net.WebSockets.ClientWebSocket');
var WebSocketMessageType = dn.type('System.Net.WebSockets.WebSocketMessageType');
var WebSocketCloseStatus = dn.type('System.Net.WebSockets.WebSocketCloseStatus');
var WebSocketReceiveResult = dn.type('System.Net.WebSockets.WebSocketReceiveResult');
var Uri = dn.type('System.Uri');
var CancellationToken = dn.type('System.Threading.CancellationToken');
var Encoding = dn.type('System.Text.Encoding');
var Convert = dn.type('System.Convert');

var runtime = dn.load('System.Runtime');
var ArraySegmentByte = dn.getType(runtime, 'System.ArraySegment`1[[System.Byte]]');
var UTF8 = dn.getProperty(Encoding, 'UTF8');
var ctNone = dn.getProperty(CancellationToken, 'None');
var msgText = dn.getProperty(WebSocketMessageType, 'Text');
var msgBinary = dn.getProperty(WebSocketMessageType, 'Binary');
var closeNormal = dn.getProperty(WebSocketCloseStatus, 'NormalClosure');

function create() {
    return dn.createInstance(ClientWebSocket, []);
}

function connect(ws, url) {
    var uri = dn.createInstance(Uri, [url]);
    return dn.callInstance(ClientWebSocket, ws, 'ConnectAsync', [uri, ctNone]);
}

function sendText(ws, text) {
    var bytes = dn.callInstance(Encoding, UTF8, 'GetBytes', [text]);
    var seg = dn.createInstance(ArraySegmentByte, [bytes]);
    return dn.callInstance(ClientWebSocket, ws, 'SendAsync', [seg, msgText, true, ctNone]);
}

function sendBytes(ws, bytes) {
    var seg = dn.createInstance(ArraySegmentByte, [bytes]);
    return dn.callInstance(ClientWebSocket, ws, 'SendAsync', [seg, msgBinary, true, ctNone]);
}

function makeBytes(size) {
    var arr = [];
    for (var i = 0; i < size; i++) arr.push(0);
    return arr;
}

function receive(ws, bufSize) {
    bufSize = bufSize || 4096;
    var bytes = makeBytes(bufSize);
    var seg = dn.createInstance(ArraySegmentByte, [bytes]);
    var result = dn.callInstance(ClientWebSocket, ws, 'ReceiveAsync', [seg, ctNone]);
    var count = dn.getInstanceProperty(WebSocketReceiveResult, result, 'Count');
    var msgType = dn.getInstanceProperty(WebSocketReceiveResult, result, 'MessageType');
    var eom = dn.getInstanceProperty(WebSocketReceiveResult, result, 'EndOfMessage');
    var segArr = dn.getInstanceProperty(ArraySegmentByte, seg, 'Array');
    var typeNum = dn.callStatic(Convert, 'ToInt32', [msgType]);
    var text = '';
    if (typeNum === 1) {
        text = dn.callInstance(Encoding, UTF8, 'GetString', [segArr, 0, count]);
    }
    return { type: typeNum, count: count, endOfMessage: eom, text: text, buffer: segArr };
}

function state(ws) {
    return dn.getInstanceProperty(ClientWebSocket, ws, 'State');
}

function close(ws) {
    return dn.callInstance(ClientWebSocket, ws, 'CloseAsync', [closeNormal, '', ctNone]);
}

module.exports = {
    create: create,
    connect: connect,
    sendText: sendText,
    sendBytes: sendBytes,
    receive: receive,
    state: state,
    close: close
};
