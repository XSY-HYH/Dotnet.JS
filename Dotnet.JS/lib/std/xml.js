// lib/std/xml.js
// XML 处理，桥接 System.Xml.XmlDocument / XmlReader / XmlWriter
var dn = require('dotnet');
var XmlDocument = dn.type('System.Xml.XmlDocument');
var XmlNode = dn.type('System.Xml.XmlNode');
var XmlReader = dn.type('System.Xml.XmlReader');
var XmlWriter = dn.type('System.Xml.XmlWriter');

// XmlDocument
function create() { return dn.createInstance(XmlDocument, []); }
function load(path) {
    var doc = create();
    dn.callInstance(XmlDocument, doc, 'Load', [path]);
    return doc;
}
function parseXml(xml) {
    var doc = create();
    dn.callInstance(XmlDocument, doc, 'LoadXml', [xml]);
    return doc;
}
function save(doc, path) { dn.callInstance(XmlDocument, doc, 'Save', [path]); }
function getDocumentElement(doc) { return dn.getInstanceProperty(XmlDocument, doc, 'DocumentElement'); }
function createElement(doc, name) { return dn.callInstance(XmlDocument, doc, 'CreateElement', [name]); }
function createNode(doc, type, name, ns) {
    if (ns !== undefined) return dn.callInstance(XmlDocument, doc, 'CreateNode', [type, name, ns]);
    return dn.callInstance(XmlDocument, doc, 'CreateNode', [type, name]);
}
function appendChild(doc, node, child) { return dn.callInstance(XmlDocument, node, 'AppendChild', [child]); }

// XmlNode 通用操作
function getOuterXml(node) { return dn.getInstanceProperty(XmlNode, node, 'OuterXml'); }
function getInnerXml(node) { return dn.getInstanceProperty(XmlNode, node, 'InnerXml'); }
function setInnerXml(node, xml) { dn.setInstanceProperty(XmlNode, node, 'InnerXml', xml); }
function getNodeName(node) { return dn.getInstanceProperty(XmlNode, node, 'Name'); }
function getNodeValue(node) { return dn.getInstanceProperty(XmlNode, node, 'InnerText'); }
function setNodeValue(node, val) { dn.setInstanceProperty(XmlNode, node, 'InnerText', val); }
function getAttributes(node) { return dn.getInstanceProperty(XmlNode, node, 'Attributes'); }
function getChildNodes(node) { return dn.getInstanceProperty(XmlNode, node, 'ChildNodes'); }
function getParentNode(node) { return dn.getInstanceProperty(XmlNode, node, 'ParentNode'); }
function selectNodes(node, xpath) { return dn.callInstance(XmlNode, node, 'SelectNodes', [xpath]); }
function selectSingleNode(node, xpath) { return dn.callInstance(XmlNode, node, 'SelectSingleNode', [xpath]); }

module.exports = {
    create: create,
    load: load,
    parseXml: parseXml,
    save: save,
    getDocumentElement: getDocumentElement,
    createElement: createElement,
    createNode: createNode,
    appendChild: appendChild,
    getOuterXml: getOuterXml,
    getInnerXml: getInnerXml,
    setInnerXml: setInnerXml,
    getNodeName: getNodeName,
    getNodeValue: getNodeValue,
    setNodeValue: setNodeValue,
    getAttributes: getAttributes,
    getChildNodes: getChildNodes,
    getParentNode: getParentNode,
    selectNodes: selectNodes,
    selectSingleNode: selectSingleNode
};
