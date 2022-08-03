'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getNtrData = exports.setNtrData = void 0
var setNtrData = function (ntrData) {
  if (typeof window === 'undefined') {
    global.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  } else {
    window.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  }
}
exports.setNtrData = setNtrData
var getNtrData = function () {
  return typeof window === 'undefined' ? global.__NEXT_TRANSLATE_ROUTES_DATA : window.__NEXT_TRANSLATE_ROUTES_DATA
}
exports.getNtrData = getNtrData
//# sourceMappingURL=ntrData.js.map
