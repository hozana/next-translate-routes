import React, { ComponentType } from 'react'
import NextLink, { LinkProps } from 'next/link'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { compile, parse as parsePath, Key } from 'path-to-regexp'
import { parse as parseQuery, stringify as stringifyQuery, ParsedUrlQuery } from 'querystring'
import { format as formatUrl, parse as parseUrl, UrlObject } from 'url'

import type { TRouteBranch } from './types'
import type { PrefetchOptions } from 'next/dist/next-server/lib/router/router'

type Options<F extends 'string' | 'object' = 'string' | 'object'> = {
  format?: F
  /** For testing only: do not use this option in production */
  routes?: TRouteBranch
  /** For testing only: do not use this option in production */
  defaultLocale?: string
}

type Url = UrlObject | string

export type Router = Omit<NextRouter, 'push' | 'replace' | 'prefetch'> & {
  push: NextRouter['push']
  replace: NextRouter['replace']
  prefetch: NextRouter['prefetch']
}

interface TransitionOptions {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const routesTree = JSON.parse(process.env.NEXT_PUBLIC_ROUTES || 'null') as TRouteBranch
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as string

/** Get children + (grand)children of children whose path must be ignord (path === '.') */
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
          translatedPathParts: [childRouteBranch.paths[locale] || childRouteBranch.paths.default],
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
      ...(translatedPathPart === '.' ? [] : [translatedPathPart]),
      ...(nextTranslatedPathsParts || []),
    ],
    augmentedQuery,
  }
}

/**
 * Translate url into option.locale locale, or if not defined, in current locale
 *
 * @param url string url or UrlObject
 * @param locale string
 * @param options (optional)
 * @param options.format `'string'` or `'object'`
 * @return string if `options.format === 'string'`,
 * UrlObject if `options.format === 'object'`,
 * same type as url if options.format is not defined
 */
export function translateUrl<U extends string | UrlObject, F extends 'string' | 'object'>(
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

export function translateUrl(
  url: Url,
  locale: string,
  { format, routes = routesTree, defaultLocale: tuDefaultLocale = defaultLocale }: Options = {},
): Url {
  const returnFormat = format || typeof url
  const urlObject = typeof url === 'object' ? (url as UrlObject) : parseUrl(url, true)
  const { pathname, query } = urlObject

  if (!pathname || !locale) {
    return returnFormat === 'object' ? url : formatUrl(url)
  }

  if (!routes) {
    throw new Error(
      '> next-translate-routes - No routes tree defined. next-translate-routes plugin is probably missing from next.config.js',
    )
  }

  const pathParts = pathname.replace(/^\//, '').split('/')
  const { translatedPathParts, augmentedQuery = {} } = translatePathParts({
    locale,
    pathParts,
    query: parseQuery(typeof query === 'string' ? query : stringifyQuery(query || {})),
    routeBranch: routes,
  })
  const path = translatedPathParts.join('/')
  const compiledPath = compile(path, { validate: false })(augmentedQuery)
  const paramsNames = (parsePath(path).filter((token) => typeof token === 'object') as Key[]).map((token) => token.name)
  const remainingQuery = Object.keys(augmentedQuery).reduce(
    (acc, key) => ({
      ...acc,
      ...(paramsNames.includes(key)
        ? {}
        : { [key]: (typeof query === 'object' && query?.[key]) || augmentedQuery[key] }),
    }),
    {},
  )

  const fullPathname = `${locale !== tuDefaultLocale ? `/${locale}` : ''}${
    routes.paths[locale] ? `/${routes.paths[locale]}` : ''
  }/${compiledPath}`

  const translatedUrlObject = {
    ...urlObject,
    pathname: fullPathname,
    query: remainingQuery,
  }

  return returnFormat === 'object' ? translatedUrlObject : formatUrl(translatedUrlObject)
}

/**
 * If url.pathname is an optional catch all filePath, but url.query does not contain the corresponding key,
 * remove the last part of url.pathname this configuration to avoid the following error:
 * ```
 * Error: The provided `as` value (/path) is incompatible with the `href` value (/path/[[...optionalCatchAllParam]]).
 * Read more: https://nextjs.org/docs/messages/incompatible-href-as
 * ```
 */
const removeEmptyCatchAll = (url: Url): Url => {
  if (typeof url === 'object' && url.pathname) {
    const query = typeof url.query === 'string' ? parseQuery(url.query) : url.query || {}
    const pathParts = url.pathname.split('/')
    const lastPathPart = pathParts.slice(-1)[0]
    const catchAllParamName = getSpreadDynamicPathPartName(lastPathPart)
    const catchAllQueryValue = catchAllParamName && query[catchAllParamName]

    if (
      catchAllParamName &&
      (!catchAllQueryValue || (Array.isArray(catchAllQueryValue) && catchAllQueryValue.length === 0))
    ) {
      return { ...url, pathname: pathParts.slice(0, pathParts.length - 1).join('/') }
    }
  }

  return url
}

export const Link: React.FC<LinkProps> = ({ href, locale, ...props }) => {
  const { locale: routerLocale } = useNextRouter()
  const language = locale || routerLocale || defaultLocale

  return <NextLink href={removeEmptyCatchAll(href)} as={translateUrl(href, language)} locale={locale} {...props} />
}

export const useRouter = (): Router => {
  const { push, replace, prefetch, ...otherRouterProps } = useNextRouter()
  const currentLang = otherRouterProps.locale || defaultLocale

  if (!otherRouterProps.locale) {
    console.error('> next-translate-routes - No locale prop in Router: fallback to defaultLocale.')
  }

  return {
    push: (url: Url, as?: Url, options?: TransitionOptions) =>
      push(removeEmptyCatchAll(url), as || translateUrl(url, options?.locale || currentLang), options),
    replace: (url: Url, as?: Url, options?: TransitionOptions) =>
      replace(removeEmptyCatchAll(url), as || translateUrl(url, options?.locale || currentLang), options),
    prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) =>
      prefetch(
        inputUrl,
        asPath || translateUrl(inputUrl, options?.locale || currentLang, { format: 'string' }),
        options,
      ),
    ...otherRouterProps,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withRouter = <P extends Record<string, any>>(Component: ComponentType<{ router: Router } & P>) =>
  Object.assign(
    (props: P) => {
      const router = useRouter()
      return <Component router={router} {...props} />
    },
    { displayName: `withRouter(${Component.displayName})` },
  )
