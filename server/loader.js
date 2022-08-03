'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.loader = void 0
function loader(rawCode) {
  var _this = this
  // Normalize slashes in a file path to be posix/unix-like forward slashes
  var normalizedPagesPath = this.query.pagesPath.replace(/\\/g, '/')
  var normalizedResourcePath = this.resourcePath.replace(/\\/g, '/')
  // Skip if current resource is not _app file
  if (!normalizedResourcePath.startsWith(''.concat(normalizedPagesPath, '_app.'))) {
    return rawCode
  }
  var uncommentedCode = rawCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  var defaultExportHocMatch = uncommentedCode.match(/^\s*import (\w+).* from ["']next-translate-routes["']/m)
  var namedExportHocMatch = uncommentedCode.match(
    /^\s*import .*\{.*withTranslateRoutes(?: as (\w+))?\W?.*\} from ["']next-translate-routes["']/m,
  )
  var defaultExportHocName =
    defaultExportHocMatch === null || defaultExportHocMatch === void 0 ? void 0 : defaultExportHocMatch[1]
  var namedExportHocName = namedExportHocMatch ? namedExportHocMatch[1] || 'withTranslateRoutes' : null
  if (!defaultExportHocName && !namedExportHocName) {
    throw new Error('[next-translate-routes] - No withTranslateRoutes high order component found in _app.')
  }
  var result = rawCode
  ;[defaultExportHocName, namedExportHocName].forEach(function (name) {
    if (name) {
      result = rawCode.replace(
        new RegExp('('.concat(name, '\\()'), 'g'),
        '$1JSON.parse(`'.concat(
          JSON.stringify(_this.query.data, function (_key, value) {
            return typeof value === 'string' ? value.replace('\\', '\\\\') : value
          }),
          '`), ',
        ),
      )
    }
  })
  return result
}
exports.loader = loader
//# sourceMappingURL=loader.js.map
