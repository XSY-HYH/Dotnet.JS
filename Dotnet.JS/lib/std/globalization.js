// lib/std/globalization.js
// 区域文化，桥接 System.Globalization.CultureInfo
var dn = require('dotnet');
var CultureInfo = dn.type('System.Globalization.CultureInfo');

function getCurrentCulture() { return dn.getProperty(CultureInfo, 'CurrentCulture'); }
function getCurrentUICulture() { return dn.getProperty(CultureInfo, 'CurrentUICulture'); }
function invariantCulture() { return dn.getProperty(CultureInfo, 'InvariantCulture'); }
function installUICulture() { return dn.getProperty(CultureInfo, 'InstalledUICulture'); }
function getCulture(name) { return dn.callStatic(CultureInfo, 'GetCultureInfo', [name]); }
function createSpecificCulture(name) { return dn.callStatic(CultureInfo, 'CreateSpecificCulture', [name]); }
function getDisplayName(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'DisplayName'); }
function getName(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'Name'); }
function getEnglishName(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'EnglishName'); }
function getTwoLetterISOLanguageName(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'TwoLetterISOLanguageName'); }
function getNativeName(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'NativeName'); }
function getLCID(culture) { return dn.getInstanceProperty(CultureInfo, culture, 'LCID'); }

module.exports = {
    getCurrentCulture: getCurrentCulture,
    getCurrentUICulture: getCurrentUICulture,
    invariantCulture: invariantCulture,
    installUICulture: installUICulture,
    getCulture: getCulture,
    createSpecificCulture: createSpecificCulture,
    getDisplayName: getDisplayName,
    getName: getName,
    getEnglishName: getEnglishName,
    getTwoLetterISOLanguageName: getTwoLetterISOLanguageName,
    getNativeName: getNativeName,
    getLCID: getLCID
};
