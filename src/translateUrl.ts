import { compile, parse as parsePath, Key } from 'path-to-regexp'
import { parse as parseQuery, stringify as stringifyQuery, ParsedUrlQuery } from 'querystring'
import { format as formatUrl, parse as parseUrl, UrlObject } from 'url'
import { normalizePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'

import { getNtrData } from './getNtrData'
import type { TRouteBranch, Url } from './types'

type Options<F extends 'string' | 'object' = 'string' | 'object'> = {
  format?: F
  withoutLangPrefix?: boolean
}

/**
 * A segment can be ignored by setting its path to "." in _routes.json.
 * It can be done for some lang only and not others.
 *
 * It can cause troubles with the redirections. Ex:
 * Given the /a/[b]/[c] and /a/[b]/[c]/d file paths. [b] is ignored and the b param is merged with the c param: ":b-:c".
 * Then /a/b/c will be redirected to /a/b-c and that is fine.
 * But /a/b-c/d will be redirected to /a/b-c-d and that is not fine.
 *
 * To handle this case, one can add a path-to-regex pattern to the default ignore token. Ex: '.(\\d+)', or '.(\[\^-\]+)'.
 * This path-to-regex pattern will be added after the segment name in the redirect.
 * Then /a/b(\\d+)/c will be redirected to /a/b-c, and /a/b-c/d will not be redirected to /a/b-c-d.
 * /!\ This is only handled in default paths (i.e. "/": ".(\\d+)" or "/": { "default": ".(\\d+)" }), not in lang-specific paths.
 */
export const ignoreSegmentPathRegex = /^\.(\(.+\))?$/

/** Get children + (grand)children of children whose path must be ignord (path === '.' or path === `.(${pathRegex})`) */
const getAllCandidates = (lang: string, children?: TRouteBranch[]): TRouteBranch[] =>
  children
    ? children.reduce((acc, child) => {
        const path = child.paths[lang] || child.paths.default
        return [...acc, ...(path === '' ? getAllCandidates(lang, child.children) : [child])]
      }, [] as TRouteBranch[])
    : []

const getSingleDynamicPathPartName = (pathPartName: string) => /^\[([^/[\].]+)\]$/.exec(pathPartName)?.[1] || null
const getSpreadDynamicPathPartName = (pathPartName: string) =>
  /^\[\[?\.{3}([^/[\].]+)\]?\]$/.exec(pathPartName)?.[1] || null

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
        child.children.some((grandChild) => grandChild.name === 'index' || /\[\[\.{3}\w+\]\]/.exec(grandChild.name))
      : !!child.children,
  )

  let currentQuery = query
  let childRouteBranch = candidates.find(({ name }) => pathPart === name)
  // If defined: pathPart is a route segment name that should be translated.
  // If dynamic, the value should already be contained in the query.

  if (!childRouteBranch) {
    // If not defined: pathPart is either a dynamic value either a wrong path.

    childRouteBranch = candidates.find((candidate) => getSingleDynamicPathPartName(candidate.name))
    if (childRouteBranch) {
      // Single dynamic route segment value => store it in the query
      currentQuery = {
        ...currentQuery,
        [childRouteBranch.name.replace(/\[|\]|\./g, '')]: pathPart,
      }
    } else {
      childRouteBranch = candidates.find((candidate) => getSpreadDynamicPathPartName(candidate.name))
      if (childRouteBranch) {
        // Catch all route => store it in the query, then return the current data.
        currentQuery = {
          ...currentQuery,
          [childRouteBranch.name.replace(/\[|\]|\./g, '')]: pathParts,
        }
        return {
          translatedPathParts: [childRouteBranch.name], // [childRouteBranch.paths[locale] || childRouteBranch.paths.default],
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

  const translatedPathPart = childRouteBranch.paths[locale] || childRouteBranch.paths.default

  return {
    translatedPathParts: [
      ...(ignoreSegmentPathRegex.test(translatedPathPart) ? [] : [translatedPathPart]),
      ...(nextTranslatedPathsParts || []),
    ],
    augmentedQuery,
  }
}

export function removeLangPrefix(pathname: string, toArray?: false): string
export function removeLangPrefix(pathname: string, toArray: true): string[]
export function removeLangPrefix(pathname: string, toArray?: boolean): string | string[] {
  const pathParts = pathname.split('/').filter(Boolean)
  const { routesTree, defaultLocale, locales } = getNtrData()

  const getLangRoot = (lang: string) => routesTree.paths[lang] || routesTree.paths.default

  const defaultLocaleRoot = defaultLocale && getLangRoot(defaultLocale)
  const hasLangPrefix = locales.includes(pathParts[0])
  const hasDefaultLocalePrefix = !hasLangPrefix && !!defaultLocaleRoot && pathParts[0] === defaultLocaleRoot

  if (!hasLangPrefix && !hasDefaultLocalePrefix) {
    return toArray ? pathParts : pathname
  }

  const locale = hasLangPrefix ? pathParts[0] : defaultLocale
  const localeRootParts = locale && getLangRoot(locale)?.split('/')
  const nbPathPartsToRemove =
    (hasLangPrefix ? 1 : 0) +
    (localeRootParts && (!hasLangPrefix || pathParts[1] === localeRootParts[0]) ? localeRootParts.length : 0)

  return toArray ? pathParts.slice(nbPathPartsToRemove) : `/${pathParts.slice(nbPathPartsToRemove).join('/')}`
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
  locale?: string,
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

export function translatePath(url: Url, locale?: string, { format }: Options = {}): Url {
  const { routesTree } = getNtrData()
  const returnFormat = format || typeof url
  const urlObject = typeof url === 'object' ? (url as UrlObject) : parseUrl(url, true)
  const { pathname, query, hash } = urlObject

  if (!pathname || !locale) {
    return returnFormat === 'object' ? url : formatUrl(url)
  }

  const pathParts = removeLangPrefix(pathname, true)

  const { translatedPathParts, augmentedQuery = {} } = translatePathParts({
    locale,
    pathParts,
    query: parseQuery(typeof query === 'string' ? query : stringifyQuery(query || {})),
    routeBranch: routesTree,
  })
  const path = translatedPathParts.join('/')
  const compiledPath = compile(path, { validate: false })(augmentedQuery)
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

  const translatedPathname = `${routesTree.paths[locale] ? `/${routesTree.paths[locale]}` : ''}/${compiledPath}`

  const translatedUrlObject = {
    ...urlObject,
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
  const parsedUrl: UrlObject = typeof url === 'string' ? parseUrl(url) : url
  if (parsedUrl.host) {
    if (typeof window === 'undefined' || parsedUrl.host !== parseUrl(window.location.href).host) {
      return url
    }
  }

  const translatedPath = translatePath(url, locale, options)
  const prefix = locale === defaultLocale || options?.withoutLangPrefix ? '' : `/${locale}`

  if (typeof translatedPath === 'object') {
    return {
      ...(translatedPath as UrlObject),
      pathname: prefix + translatedPath.pathname,
    }
  }
  return normalizePathTrailingSlash(prefix + translatedPath)
}) as typeof translatePath

export default translateUrl
