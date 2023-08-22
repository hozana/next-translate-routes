import { normalizePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'
import { parse as parsePathPattern, compile as compilePath } from 'path-to-regexp'
import { format as formatUrl, UrlObject } from 'url'

import { getLocalePathFromPaths } from '../plugin/getPathFromPaths'
import { getNtrData } from '../shared/ntrData'
import { ignoreSegmentPathRegex, optionalMatchAllFilepathPartRegex } from '../shared/regex'
import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { TRouteBranch } from '../types'
import { fileUrlToFileUrlObject } from './fileUrlToFileUrlObject'

/**
 * Get pattern from route branch paths property in the specified locale,
 * or, if it does not exist, the default path.
 */
const getPatternFromRoutePaths = (routeBranch: TRouteBranch, locale: string) => {
  const pattern = getLocalePathFromPaths({ paths: routeBranch.paths, locale })
  return ignoreSegmentPathRegex.test(pattern) ? '' : pattern
}

/** Add `/` prefix only if `pattern` is not an empty string and does not already have it */
const addSlashPrefix = (path: string) => (path === '' || path.startsWith('/') ? path : `/${path}`)

/** Get the translated path of a route branch (handling ignored path parts, index, match all, etc.) */
const getTranslatedPathPart = ({
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
 * Recursively get translated path (path-to-regexp syntax) given:
 * - a route branch
 * - file path parts
 * - a locale
 *
 * Ex: Given `/[dynamic]/path` is an existing file path:
 *
 * `/[dynamic]/path` => `/:dynamic/path`
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
}): string => {
  const isLastPathPart = pathParts.length === 0

  /** Current part path pattern */
  const currentTranslatedPathPart = getTranslatedPathPart({
    routeBranch,
    locale,
    isLastPathPart,
  })

  if (isLastPathPart) {
    return currentTranslatedPathPart
  }

  const [nextFilePathPart, ...remainingFilePathParts] = pathParts

  // Next parts path patterns: looking for the child corresponding to nextPathPart:
  // if nextPathPart does not match any child name and a dynamic child is found,
  // we will consider that nextPathPart is a value given to the dynamic child

  const matchingChild = routeBranch.children?.find(
    (child) => child.name === nextFilePathPart || child?.paths?.[locale] === nextFilePathPart,
  )

  if (!matchingChild) {
    throw new Error(`${nextFilePathPart} not found in ${routeBranch.name || 'pages'}`)
  }

  const remainingTranslatedPath = getTranslatedPathPattern({
    routeBranch: matchingChild,
    pathParts: remainingFilePathParts,
    locale,
  })

  return currentTranslatedPathPart + remainingTranslatedPath
}

/**
 * Translate Next file url into translated string url
 *
 * @param url Next default file url
 * @param locale The target locale
 * @param option.throwOnError (Default to true) Throw if the input url does not match any page
 *
 * @returns The url string or undefined if no page matched and option.throwOnError is set to false
 * @throws If and the input url does not match any page and option.throwOnError in not set to false
 */
export const fileUrlToUrl = (url: UrlObject | URL | string, locale: string, { throwOnError = true } = {}) => {
  try {
    const { pathname, query, hash } = fileUrlToFileUrlObject({
      fileUrl: url,
      locale,
    })

    const { routesTree, defaultLocale } = getNtrData()

    const pathParts = (pathname || '/')
      .replace(/^\/|\/$/g, '')
      .split('/')
      .filter(Boolean)

    const pathPattern = getTranslatedPathPattern({
      routeBranch: routesTree,
      pathParts,
      locale,
    })

    const newPathname = normalizePathTrailingSlash(compilePath(pathPattern)(query))

    for (const patternToken of parsePathPattern(pathPattern)) {
      if (typeof patternToken === 'object' && patternToken.name) {
        delete query[patternToken.name]
      }
    }

    return `${locale !== defaultLocale ? `/${locale}` : ''}${formatUrl({
      pathname: newPathname,
      query,
      hash,
    })}`
  } catch (cause) {
    if (throwOnError) {
      throw new Error(ntrMessagePrefix + `No page found for the following file url: ${url.toString()}`, { cause })
    }
    return undefined
  }
}
