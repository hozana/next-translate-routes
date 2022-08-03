'use strict'
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i]
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
        }
        return t
      }
    return __assign.apply(this, arguments)
  }
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {}
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p]
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]]
      }
    return t
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.Link = void 0
var react_1 = __importDefault(require('react'))
var link_1 = __importDefault(require('next/link'))
var router_1 = require('next/router')
var translateUrl_1 = require('./translateUrl')
/**
 * Link component that handle route translations
 */
var Link = function (_a) {
  var href = _a.href,
    as = _a.as,
    propLocale = _a.locale,
    props = __rest(_a, ['href', 'as', 'locale'])
  var _b = (0, router_1.useRouter)(),
    routerLocale = _b.locale,
    defaultLocale = _b.defaultLocale,
    locales = _b.locales
  var locale =
    propLocale || routerLocale || defaultLocale || (locales === null || locales === void 0 ? void 0 : locales[0])
  var unPrefixedHref = typeof href === 'string' ? (0, translateUrl_1.removeLangPrefix)(href) : href
  if (!propLocale && typeof href === 'string' && unPrefixedHref !== href) {
    var hrefLocale = unPrefixedHref !== href ? href.split('/')[1] : null
    if (hrefLocale && (!locales || locales.includes(hrefLocale))) {
      locale = hrefLocale
    }
  }
  return react_1.default.createElement(
    link_1.default,
    __assign(
      {
        href: unPrefixedHref,
        as: as || (0, translateUrl_1.translateUrl)(href, locale, { format: 'string' }),
        locale: locale,
      },
      props,
    ),
  )
}
exports.Link = Link
exports.default = exports.Link
//# sourceMappingURL=link.js.map
