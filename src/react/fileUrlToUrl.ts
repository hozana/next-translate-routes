import { normalizePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'
import { parse as parsePathPattern, compile as compilePath } from 'path-to-regexp'
import { format as formatUrl, UrlObject } from 'url'

import { ignoreSegmentPathRegex } from '../shared/regex'
import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { TRouteBranch } from '../types'
import { getNtrData } from './ntrData'
import { urlToUrlObject } from './urlToUrlObject'

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
      const indexChild = routeBranch.children.find((child) => child.name === 'index' && !child.children?.length)
      if (!indexChild) {
        throw new Error(`No index file found in "${routeBranch.name}" folder.`)
      }
      const indexChildPattern = getPatternFromRoutePaths(indexChild, locale)
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
 * Get path pattern (path-to-regexp synthax) from file path parts
 *
 * Ex: `/[dynamic]/path` => `/:dynamic/path`
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

  const currentPathPatternPart = getPathPatternPart({ routeBranch, locale, isLastPathPart })

  if (isLastPathPart) {
    return currentPathPatternPart
  }

  const nextPathPart = pathParts[0]
  const remainingPathParts = pathParts.slice(1)

  for (const child of routeBranch.children || []) {
    if (
      // child name must match nextPathPart
      child.name === nextPathPart &&
      // child.children must be coherent with remaining path parts is case a file and and folder share the same name
      (remainingPathParts.length === 0 || child.children?.length)
    ) {
      return (
        currentPathPatternPart +
        getTranslatedPathPattern({
          routeBranch: child,
          pathParts: remainingPathParts,
          locale,
        })
      )
    }
  }
  throw new Error(`No "/${pathParts.join('/')}" page found in "${routeBranch.name}" folder.`)
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

    // Create a new query object that we can mutate
    const newQuery = { ...query }

    const pathPattern = getTranslatedPathPattern({ routeBranch: routesTree, pathParts, locale })
    const newPathname = normalizePathTrailingSlash(compilePath(pathPattern)(query))

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
