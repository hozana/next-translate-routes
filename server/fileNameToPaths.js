'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.fileNameToPath = void 0
/** Transform Next file-system synthax to path-to-regexp synthax */
var fileNameToPath = function (fileName) {
  return fileName
    .replace(/\[\[\.\.\.(\S+)\]\]/g, ':$1*') // [[...param]]
    .replace(/\[\.\.\.(\S+)\]/g, ':$1+') // [...param]
    .replace(/\[(\S+)\]/g, ':$1')
} // [param]
exports.fileNameToPath = fileNameToPath
//# sourceMappingURL=fileNameToPaths.js.map
