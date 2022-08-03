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
var __read =
  (this && this.__read) ||
  function (o, n) {
    var m = typeof Symbol === 'function' && o[Symbol.iterator]
    if (!m) return o
    var i = m.call(o),
      r,
      ar = [],
      e
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value)
    } catch (error) {
      e = { error: error }
    } finally {
      try {
        if (r && !r.done && (m = i['return'])) m.call(i)
      } finally {
        if (e) throw e.error
      }
    }
    return ar
  }
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i)
          ar[i] = from[i]
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from))
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.getRouteBranchReRoutes = exports.getPageReRoutes = void 0
var path_to_regexp_1 = require('path-to-regexp')
var fileNameToPaths_1 = require('./fileNameToPaths')
var ignoreSegmentPathRegex_1 = require('../shared/ignoreSegmentPathRegex')
/** Remove brackets and custom regexp from source to get valid destination */
var sourceToDestination = function (sourcePath) {
  return sourcePath.replace(/[{}]|(:\w+)\([^)]+\)/g, function (_match, arg) {
    return arg || ''
  })
}
var staticSegmentRegex = /^[\w-_]+$|^\([\w-_|]+\)$/
/**
 * Find index of a similar redirect/rewrite
 * This is used to merge similar redirects and rewrites
 */
var getSimilarIndex = function (sourceSegments, acc) {
  return acc.findIndex(function (_a) {
    var otherSource = _a.source
    var otherSourceSegments = otherSource.split('/')
    return (
      // source and otherSource must have the same segments number
      otherSourceSegments.length === sourceSegments.length &&
      // each corresponding source and otherSource segments should be compatible, which means that...
      sourceSegments.every(function (sourceSegment, index) {
        var correspondingSegment = otherSourceSegments[index]
        return (
          // ...either they are equal
          sourceSegment === correspondingSegment ||
          // ...either they are both static
          (staticSegmentRegex.test(sourceSegment) && staticSegmentRegex.test(correspondingSegment))
        )
      })
    )
  })
}
/**
 * mergeOrRegex('(one|two|tree)', 'four') => '(one|two|tree|four)'
 * mergeOrRegex('(one|two|tree)', 'tree') => '(one|two|tree)'
 */
var mergeOrRegex = function (existingRegex, newPossiblity) {
  var existingPossibilities = existingRegex.replace(/\(|\)/g, '').split('|')
  return existingPossibilities.includes(newPossiblity)
    ? existingRegex
    : '('.concat(
        __spreadArray(__spreadArray([], __read(existingPossibilities), false), [newPossiblity], false).join('|'),
        ')',
      )
}
/**
 * Get redirects and rewrites for a page
 */
var getPageReRoutes = function (_a) {
  var locales = _a.locales,
    routeSegments = _a.routeSegments,
    defaultLocale = _a.defaultLocale
  /** If there is only one path possible: it is common to all locales and to files. No redirection nor rewrite is needed. */
  if (
    !routeSegments.some(function (_a) {
      var paths = _a.paths
      return Object.keys(paths).length > 1
    })
  ) {
    return { rewrites: [], redirects: [] }
  }
  /** Get a translated path or base path */
  var getPath = function (locale) {
    return '/'.concat(
      routeSegments
        .map(function (_a) {
          var paths = _a.paths
          return paths[locale] || paths.default
        })
        .filter(function (pathPart) {
          return pathPart && !ignoreSegmentPathRegex_1.ignoreSegmentPathRegex.test(pathPart)
        })
        .join('/'),
    )
  }
  /** File path in path-to-regexp syntax (cannot be customised in routes data files) */
  var basePath = '/'.concat(
    routeSegments
      .map(function (_a) {
        var name = _a.name,
          defaultPath = _a.paths.default
        var match = defaultPath.match(ignoreSegmentPathRegex_1.ignoreSegmentPathRegex) || []
        // If a pattern is added to the ignore token "."
        return (0, fileNameToPaths_1.fileNameToPath)(name) + (match[1] || '')
      })
      .filter(function (pathPart) {
        return pathPart
      })
      .join('/'),
  )
  /**
   * ```
   * [
   *   { locales: ['en'], path: '/english/path/without/locale/prefix' },
   *   { locales: ['fr'], path: '/french/path/without/locale/prefix' },
   *   { locales: ['es', 'pt'], path: '/path/common/to/several/locales' },
   * ]
   * ```
   * Each locale cannot appear more than once. Item is ignored if its path would be the same as basePath.
   */
  var sourceList = locales.reduce(function (acc, locale) {
    var source = getPath(locale)
    if (source === basePath) {
      return acc
    }
    var _a = (
        acc.find(function (sourceItem) {
          return sourceItem.source === source
        }) || {}
      ).sourceLocales,
      sourceLocales = _a === void 0 ? [] : _a
    return __spreadArray(
      __spreadArray(
        [],
        __read(
          acc.filter(function (sourceItem) {
            return sourceItem.source !== source
          }),
        ),
        false,
      ),
      [
        {
          source: source,
          sourceLocales: __spreadArray(__spreadArray([], __read(sourceLocales), false), [locale], false),
        },
      ],
      false,
    )
  }, [])
  var redirects = locales.reduce(function (acc, locale) {
    var _a
    var localePath = getPath(locale)
    var destination = ''
      .concat(locale === defaultLocale ? '' : '/'.concat(locale))
      .concat(sourceToDestination(localePath))
    return __spreadArray(
      __spreadArray([], __read(acc), false),
      __read(
        (_a = sourceList.filter(function (_a) {
          var sourceLocales = _a.sourceLocales
          return !sourceLocales.includes(locale)
        })).concat
          .apply(
            _a,
            __spreadArray([], __read(localePath === basePath ? [] : [{ sourceLocales: [], source: basePath }]), false),
          )
          .reduce(function (acc, _a) {
            var rawSource = _a.source
            var source = '/'.concat(locale).concat(rawSource)
            var sourceSegments = source.split('/')
            // Look for similar redirects
            var similarIndex = getSimilarIndex(sourceSegments, acc)
            // If similar redirect exist, merge the new one
            if (similarIndex >= 0) {
              var similar = acc[similarIndex]
              var mergedWithSimilar = __assign(__assign({}, similar), {
                source: similar.source
                  .split('/')
                  .map(function (similarSegment, index) {
                    return sourceSegments[index] === similarSegment
                      ? similarSegment
                      : mergeOrRegex(similarSegment, sourceSegments[index])
                  })
                  .join('/'),
              })
              // Avoid to merge path that would introduce redirect loop
              if (!(0, path_to_regexp_1.pathToRegexp)(mergedWithSimilar.source).test(destination)) {
                return __spreadArray(
                  __spreadArray(
                    __spreadArray([], __read(acc.slice(0, similarIndex)), false),
                    [mergedWithSimilar],
                    false,
                  ),
                  __read(acc.slice(similarIndex + 1)),
                  false,
                )
              }
            }
            // Else append the new redirect
            return __spreadArray(
              __spreadArray([], __read(acc), false),
              [
                {
                  source: source,
                  destination: destination,
                  locale: false,
                  permanent: true,
                },
              ],
              false,
            )
          }, [])
          .filter(function (_a) {
            var source = _a.source,
              destination = _a.destination
            return sourceToDestination(source) !== destination
          }),
      ),
      false,
    )
  }, [])
  var destination = sourceToDestination(basePath)
  var rewrites = sourceList.reduce(function (acc, _a) {
    var source = _a.source
    if (sourceToDestination(source) === destination) {
      return acc
    }
    var sourceSegments = source.split('/')
    // Look for similar rewrites
    var similarIndex = getSimilarIndex(sourceSegments, acc)
    // If similar rewrite exist, merge the new one
    if (similarIndex >= 0) {
      var similar = acc[similarIndex]
      return __spreadArray(
        __spreadArray(
          __spreadArray([], __read(acc.slice(0, similarIndex)), false),
          [
            __assign(__assign({}, similar), {
              source: similar.source
                .split('/')
                .map(function (similarSegment, index) {
                  return similarSegment === sourceSegments[index]
                    ? similarSegment
                    : '('.concat(
                        similarSegment.replace(/\(|\)/g, '').split('|').concat(sourceSegments[index]).join('|'),
                        ')',
                      )
                })
                .join('/'),
            }),
          ],
          false,
        ),
        __read(acc.slice(similarIndex + 1)),
        false,
      )
    }
    // Else append a new rewrite
    return __spreadArray(
      __spreadArray([], __read(acc), false),
      [
        {
          source: source,
          destination: destination,
        },
      ],
      false,
    )
  }, [])
  return { redirects: redirects, rewrites: rewrites }
}
exports.getPageReRoutes = getPageReRoutes
/**
 * Generate reroutes in route branch to feed the rewrite section of next.config
 */
var getRouteBranchReRoutes = function (_a) {
  var locales = _a.locales,
    _b = _a.routeBranch,
    children = _b.children,
    routeSegment = __rest(_b, ['children']),
    _c = _a.previousRouteSegments,
    previousRouteSegments = _c === void 0 ? [] : _c,
    defaultLocale = _a.defaultLocale
  var routeSegments = __spreadArray(__spreadArray([], __read(previousRouteSegments), false), [routeSegment], false)
  return children
    ? children.reduce(
        function (acc, child) {
          var childReRoutes =
            child.name === 'index'
              ? (0, exports.getPageReRoutes)({
                  locales: locales,
                  routeSegments: routeSegments,
                  defaultLocale: defaultLocale,
                })
              : (0, exports.getRouteBranchReRoutes)({
                  locales: locales,
                  routeBranch: child,
                  previousRouteSegments: routeSegments,
                  defaultLocale: defaultLocale,
                })
          return {
            redirects: __spreadArray(
              __spreadArray([], __read(acc.redirects), false),
              __read(childReRoutes.redirects),
              false,
            ),
            rewrites: __spreadArray(
              __spreadArray([], __read(acc.rewrites), false),
              __read(childReRoutes.rewrites),
              false,
            ),
          }
        },
        { redirects: [], rewrites: [] },
      )
    : (0, exports.getPageReRoutes)({ locales: locales, routeSegments: routeSegments, defaultLocale: defaultLocale })
}
exports.getRouteBranchReRoutes = getRouteBranchReRoutes
//# sourceMappingURL=getRouteBranchReRoutes.js.map
