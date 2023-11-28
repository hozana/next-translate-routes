import { normalizePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'
import { formatUrl } from 'next/dist/shared/lib/router/utils/format-url'
import { ParsedUrl } from 'next/dist/shared/lib/router/utils/parse-url'
import type { Key } from 'path-to-regexp'
import { compile as compilePath, parse as parsePath } from 'path-to-regexp'
import type { ParsedUrlQuery } from 'querystring'
import { UrlObject } from 'url'

import { getLocalePathFromPaths } from '../plugin/getPathFromPaths'
import { getNtrData } from '../shared/ntrData'
import { getDynamicPathPartKey, getSpreadFilepathPartKey, ignoreSegmentPathRegex } from '../shared/regex'
import type { TRouteBranch, Url } from '../types'
import { parseUrl } from './parseUrl'
import { removeLangPrefix } from './removeLangPrefix'

type Options<F extends 'string' | 'object' = 'string' | 'object'> = {
  format?: F
  withoutLangPrefix?: boolean
}

/** Get children + (grand)children of children whose path must be ignord (path === '.' or path === `.(${pathRegex})`) */
const getAllCandidates = (lang: string, children?: TRouteBranch[]): TRouteBranch[] =>
  children
    ? children.reduce((acc, child) => {
        const path = getLocalePathFromPaths({ paths: child.paths, locale: lang })
        return [...acc, ...(path === '' ? getAllCandidates(lang, child.children) : [child])]
      }, [] as TRouteBranch[])
    : []

/**
 * Recursively translate paths from file path, and extract parameters
 */
const translatePathParts = ({
  locale,
  pathParts,
  routeBranch,
  query,
}: {
  locale: string
  /** Can be a bare name or a dynamic value */
  pathParts: string[]
  routeBranch: TRouteBranch
  query?: ParsedUrlQuery
}): { augmentedQuery?: ParsedUrlQuery; translatedPathParts: string[] } => {
  const { children } = routeBranch

  if (!Array.isArray(pathParts)) {
    throw new Error('Wrong pathParts argument in translatePathParts')
  }

  if (pathParts.length === 0) {
    return { translatedPathParts: [], augmentedQuery: query }
  }

  const pathPart = pathParts[0]
  const nextPathParts = pathParts.slice(1)

  if (!pathPart) {
    return translatePathParts({ locale, pathParts: nextPathParts, routeBranch, query })
  }

  const candidates = getAllCandidates(locale, children).filter((child) =>
    pathParts.length === 1 // Last path part
      ? !child.children ||
        child.children.some((grandChild) => grandChild.name === 'index' || /\[\[\.{0,3}\w+\]\]/.exec(grandChild.name))
      : !!child.children || /\[\[?\.{3}\w+\]?\]/.exec(child.name),
  )

  let currentQuery = query

  /**
   * If defined: pathPart is a route segment name that should be translated.
   * If dynamic, the value should already be contained in the query.
   */
  let childRouteBranch = candidates.find(({ name }) => pathPart === name)

  if (!childRouteBranch) {
    // If not defined: pathPart is either a dynamic value either a wrong path.

    childRouteBranch = candidates.find((candidate) => getDynamicPathPartKey(candidate.name))
    if (childRouteBranch) {
      // Single dynamic route segment value => store it in the query
      currentQuery = {
        ...currentQuery,
        [childRouteBranch.name.replace(/[[\].]/g, '')]: pathPart,
      }
    } else {
      childRouteBranch = candidates.find((candidate) => getSpreadFilepathPartKey(candidate.name))
      if (childRouteBranch) {
        // Catch all route => store it in the query, then return the current data.
        currentQuery = {
          ...currentQuery,
          [childRouteBranch.name.replace(/[[\].]/g, '')]: pathParts,
        }
        return {
          translatedPathParts: [getLocalePathFromPaths({ paths: childRouteBranch.paths, locale })],
          augmentedQuery: currentQuery,
        }
      }
      // No route match => return the remaining path as is
      return { translatedPathParts: pathParts, augmentedQuery: query }
    }
  }

  // Get the descendants translated path parts and query values
  const { augmentedQuery, translatedPathParts: nextTranslatedPathsParts } = childRouteBranch?.children
    ? translatePathParts({ locale, pathParts: nextPathParts, routeBranch: childRouteBranch, query: currentQuery })
    : { augmentedQuery: currentQuery, translatedPathParts: [] }

  const translatedPathPart = getLocalePathFromPaths({ paths: childRouteBranch.paths, locale })

  return {
    translatedPathParts: [
      ...(ignoreSegmentPathRegex.test(translatedPathPart) ? [] : [translatedPathPart]),
      ...(nextTranslatedPathsParts || []),
    ],
    augmentedQuery,
  }
}

/**
 * Translate path into locale
 *
 * @param url string url or UrlObject
 * @param locale string
 * @param options (optional)
 * @param options.format `'string'` or `'object'`
 * @return string if `options.format === 'string'`,
 * UrlObject if `options.format === 'object'`,
 * same type as url if options.format is not defined
 */
export function translatePath<U extends string | UrlObject, F extends 'string' | 'object'>(
  url: U,
  locale: string,
  options?: Options<F>,
): 'string' | 'object' extends F
  ? U extends string
    ? string
    : U extends UrlObject
    ? UrlObject
    : Url
  : F extends 'string'
  ? string
  : UrlObject

export function translatePath(url: Url, locale: string, { format }: Options = {}): Url {
  const { routesTree } = getNtrData()
  const returnFormat = format || typeof url
  const parsedUrl = parseUrl(url)
  const { pathname, query, hash } = parsedUrl

  if (!pathname || !locale) {
    if (returnFormat === 'object') {
      return typeof url === 'object' ? url : parseUrl(url)
    }
    return typeof url === 'object' ? formatUrl(url) : url
  }

  const pathParts = removeLangPrefix(pathname, true)

  const { translatedPathParts, augmentedQuery = {} } = translatePathParts({
    locale,
    pathParts,
    query,
    routeBranch: routesTree,
  })
  const path = translatedPathParts.join('/')
  const compiledPath = compilePath(path, { validate: false })(augmentedQuery)
  const paramNames = (parsePath(path).filter((token) => typeof token === 'object') as Key[]).map((token) => token.name)
  const remainingQuery = Object.keys(augmentedQuery).reduce(
    (acc, key) => ({
      ...acc,
      ...(paramNames.includes(key)
        ? {}
        : { [key]: (typeof query === 'object' && query?.[key]) || augmentedQuery[key] }),
    }),
    {},
  )

  const translatedPathname = (routesTree.paths[locale] ? `/${routesTree.paths[locale]}` : '') + `/${compiledPath}`

  const translatedUrlObject = {
    ...parsedUrl,
    hash,
    pathname: translatedPathname,
    query: remainingQuery,
  }

  return returnFormat === 'object' ? translatedUrlObject : formatUrl(translatedUrlObject)
}

export type TTranslateUrl = typeof translatePath

/**
 * Translate url into locale
 *
 * Will soon be deprecated in favor of fileUrlToUrl and urlToFileUrl
 *
 * @param url string url or UrlObject
 * @param locale string
 * @param options (optional)
 * @param options.format `'string'` or `'object'`
 * @return string if `options.format === 'string'`,
 * UrlObject if `options.format === 'object'`,
 * same type as url if options.format is not defined
 */
export const translateUrl: TTranslateUrl = ((url, locale, options) => {
  const { defaultLocale } = getNtrData()

  // Handle external urls
  const parsedUrl: ParsedUrl | UrlObject = typeof url === 'string' ? parseUrl(url) : url
  if (parsedUrl.hostname) {
    if (typeof window === 'undefined' || parsedUrl.hostname !== parseUrl(window.location.href).hostname) {
      return url
    }
  }

  const translatedPath = translatePath(url, locale, options)

  if (typeof translatedPath === 'object') {
    return translatedPath
  }

  const prefix = locale === defaultLocale || options?.withoutLangPrefix ? '' : `/${locale}`

  return normalizePathTrailingSlash(prefix + (translatedPath as string))
}) as typeof translatePath
