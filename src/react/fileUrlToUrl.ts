import { normalizePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'
import { parse as parsePathPattern, compile as compilePath } from 'path-to-regexp'
import { format as formatUrl, UrlObject } from 'url'

import {
  anyDynamicFilepathPartRegex,
  dynamicFilepathPartsRegex,
  getDynamicPathPartKey,
  ignoreSegmentPathRegex,
  optionalMatchAllFilepathPartRegex,
  spreadFilepathPartRegex,
} from '../shared/regex'
import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { TRouteBranch } from '../types'
import { getNtrData } from './ntrData'
import { urlToUrlObject } from './urlToUrlObject'

/**
 * Get pattern from route branch paths property in the specified locale,
 * or, if it does not exist, the default path.
 */
const getPatternFromRoutePaths = (routeBranch: TRouteBranch, locale: string) => {
  const pattern = routeBranch.paths[locale] || routeBranch.paths.default
  return ignoreSegmentPathRegex.test(pattern) ? '' : pattern
}

/** Add `/` prefix only if `pattern` is not an empty string and does not already have it */
const addSlashPrefix = (path: string) => (path === '' || path.startsWith('/') ? path : `/${path}`)

const getPathPatternPart = ({
  routeBranch,
  locale,
  isLastPathPart,
}: {
  routeBranch: TRouteBranch
  locale: string
  isLastPathPart: boolean
}) => {
  let pattern = getPatternFromRoutePaths(routeBranch, locale)

  if (isLastPathPart) {
    if (routeBranch.children?.length) {
      const silentChild = routeBranch.children.find(
        (child) =>
          !child.children?.length && (child.name === 'index' || optionalMatchAllFilepathPartRegex.test(child.name)),
      )
      if (!silentChild) {
        throw new Error(`No index file found in "${routeBranch.name}" folder.`)
      }
      const indexChildPattern = getPatternFromRoutePaths(silentChild, locale)
      if (indexChildPattern && indexChildPattern !== 'index') {
        pattern = pattern + addSlashPrefix(indexChildPattern)
      }
    } else if (pattern === 'index' && routeBranch.name === 'index') {
      pattern = ''
    }
  }

  return addSlashPrefix(pattern)
}

/**
 * Recursively get path pattern (path-to-regexp syntax) from file path parts
 *
 * Ex, given `/[dynamic]/path` is an existing file path:
 * `/[dynamic]/path` => { pattern: `/:dynamic/path`, values: {} }
 * `/value/path` => { pattern: `/:dynamic/path`, values: { dynamic: 'value' } }
 */
export const getTranslatedPathPattern = ({
  routeBranch,
  pathParts,
  locale,
}: {
  routeBranch: TRouteBranch
  /** Remaining path parts after the `routeBranch` path parts */
  pathParts: string[]
  locale: string
}): { pattern: string; values: Record<string, string | string[]> } => {
  const isLastPathPart = pathParts.length === 0

  /** Current part path pattern */
  const currentPathPatternPart = getPathPatternPart({ routeBranch, locale, isLastPathPart })

  if (isLastPathPart) {
    return { pattern: currentPathPatternPart, values: {} }
  }

  const nextPathPart = pathParts[0]
  const remainingPathParts = pathParts.slice(1)
  const hasNextPathPartDynamicSyntax = anyDynamicFilepathPartRegex.test(nextPathPart)

  // Next parts path patterns: looking for the child corresponding to nextPathPart:
  // if nextPathPart does not match any child name and a dynamic child is found,
  // we will consider that nextPathPart is a value given to the dynamic child

  let matchingChild: TRouteBranch | undefined = undefined

  for (const child of routeBranch.children || []) {
    if (
      // child.children must be coherent with remaining path parts is case a file and and folder share the same name
      remainingPathParts.length === 0 ||
      child.children?.length
    ) {
      if (child.name === nextPathPart) {
        matchingChild = child
        break
      } else if (
        // If nextPathPart already have a dynamic syntax, it must match the name, no need to go further
        !hasNextPathPartDynamicSyntax &&
        // If the current child is dynamic and...
        anyDynamicFilepathPartRegex.test(child.name) &&
        // ...there is no matching child found for now, or...
        (!matchingChild ||
          // ...the matchingChild has a sread syntax and the new one has not (priority)
          (spreadFilepathPartRegex.test(matchingChild.name) && dynamicFilepathPartsRegex.test(child.name)))
      ) {
        matchingChild = child
      }
    }
  }

  if (matchingChild) {
    /** If we found an exact match, no need to add values */
    const isExactMatch = matchingChild.name === nextPathPart
    const dynamicPathPartKey = getDynamicPathPartKey(matchingChild.name)

    const { pattern: nextPattern, values: nextValues } = getTranslatedPathPattern({
      routeBranch: matchingChild,
      pathParts: remainingPathParts,
      locale,
    })

    const pattern = currentPathPatternPart + nextPattern
    const values =
      isExactMatch || !dynamicPathPartKey
        ? nextValues
        : {
            [dynamicPathPartKey]: spreadFilepathPartRegex.test(matchingChild.name) ? pathParts : nextPathPart,
            ...nextValues,
          }

    return { pattern, values }
  }

  throw new Error(`No "/${pathParts.join('/')}" page found in /${routeBranch.name} folder.`)
}

/**
 * Translate Next file url into translated string url
 *
 * @param url Next default file url
 * @param locale string
 */
export const fileUrlToUrl = (url: UrlObject | URL | string, locale: string) => {
  const { routesTree, defaultLocale } = getNtrData()

  const { pathname, query, hash } = urlToUrlObject(url)

  if (!routesTree.children) {
    throw new Error('No page found. You probably need to add the pageDirectory option in your translateRoutes config.')
  }

  try {
    const pathParts = (pathname || '/')
      .replace(/^\/|\/$/g, '')
      .split('/')
      .filter(Boolean)

    const { pattern: pathPattern, values } = getTranslatedPathPattern({ routeBranch: routesTree, pathParts, locale })

    const newQuery = { ...query, ...values }
    const newPathname = normalizePathTrailingSlash(compilePath(pathPattern)(newQuery))

    for (const patterToken of parsePathPattern(pathPattern)) {
      if (typeof patterToken === 'object' && patterToken.name) {
        delete newQuery[patterToken.name]
      }
    }

    return `${locale !== defaultLocale ? `/${locale}` : ''}${formatUrl({
      pathname: newPathname,
      query: newQuery,
      hash,
    })}`
  } catch (error) {
    throw new Error(ntrMessagePrefix + `No page found for pathname ${pathname}`, { cause: error })
  }
}
