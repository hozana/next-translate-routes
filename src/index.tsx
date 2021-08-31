import React, { ComponentType } from 'react'
import NextLink, { LinkProps } from 'next/link'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context'
import { compile, parse as parsePath } from 'path-to-regexp'
import { parse as parseQuery, stringify as stringifyQuery, ParsedUrlQuery } from 'querystring'
import { format as formatUrl, parse as parseUrl, UrlObject } from 'url'

import type { Key } from 'path-to-regexp'
import type { TRouteBranch } from './types'
import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'

type Options<F extends 'string' | 'object' = 'string' | 'object'> = {
  format?: F
  /** For testing only: do not use this option in production */
  routesTree?: TRouteBranch
  /** For testing only: do not use this option in production */
  locales?: string[]
  /** For testing only: do not use this option in production */
  defaultLocale?: string
}

type Url = UrlObject | string

interface TransitionOptions {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const routesTree = JSON.parse(process.env.NEXT_PUBLIC_ROUTES || 'null') as TRouteBranch
const locales = (process.env.NEXT_PUBLIC_LOCALES || '').split(',') as string[]
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
      ...(translatedPathPart === '.' ? [] : [translatedPathPart]),
      ...(nextTranslatedPathsParts || []),
    ],
    augmentedQuery,
  }
}

const removeLangPrefix = (pathParts: string[], options: Options = {}): string[] => {
  const {
    routesTree: optionsRoutesTree = routesTree,
    locales: optionsLocales = locales,
    defaultLocale: optionsDefaultLocale = defaultLocale,
  } = options

  const getLangRoot = (lang: string) => optionsRoutesTree.paths[lang] || optionsRoutesTree.paths.default

  const hasLangPrefix = optionsLocales.includes(pathParts[0])
  const defaultLocaleRoot = getLangRoot(optionsDefaultLocale)
  const hasDefaultLocalePrefix = !hasLangPrefix && !!defaultLocaleRoot && pathParts[0] === defaultLocaleRoot

  const locale = hasLangPrefix ? pathParts[0] : hasDefaultLocalePrefix ? optionsDefaultLocale : undefined

  if (!locale) {
    return pathParts
  }

  const nbPathPartsToRemove =
    (locale === optionsDefaultLocale ? 0 : 1) + (getLangRoot(locale) ? getLangRoot(locale).split('/').length : 0)

  return pathParts.slice(nbPathPartsToRemove)
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

export function translateUrl(url: Url, locale: string, options: Options = {}): Url {
  const {
    format,
    routesTree: optionsRoutesTree = routesTree,
    defaultLocale: optionsDefaultLocale = defaultLocale,
  } = options
  const returnFormat = format || typeof url
  const urlObject = typeof url === 'object' ? (url as UrlObject) : parseUrl(url, true)
  const { pathname, query } = urlObject

  if (!pathname || !locale) {
    return returnFormat === 'object' ? url : formatUrl(url)
  }

  if (!optionsRoutesTree) {
    throw new Error(
      '> next-translate-routes - No routes tree defined. next-translate-routes plugin is probably missing from next.config.js',
    )
  }

  const rawPathParts = pathname.replace(/^\//, '').split('/')
  const pathParts = removeLangPrefix(rawPathParts, options)

  const { translatedPathParts, augmentedQuery = {} } = translatePathParts({
    locale,
    pathParts,
    query: parseQuery(typeof query === 'string' ? query : stringifyQuery(query || {})),
    routeBranch: optionsRoutesTree,
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

  const fullPathname = `${locale !== optionsDefaultLocale ? `/${locale}` : ''}${
    optionsRoutesTree.paths[locale] ? `/${optionsRoutesTree.paths[locale]}` : ''
  }/${compiledPath}`

  const translatedUrlObject = {
    ...urlObject,
    pathname: fullPathname,
    query: remainingQuery,
  }

  return returnFormat === 'object' ? translatedUrlObject : formatUrl(translatedUrlObject)
}

/**
 * Link component that handle route translations
 */
export const Link: React.FC<LinkProps> = ({ href, as, locale, ...props }) => {
  const { locale: routerLocale } = useNextRouter()
  const language = locale || routerLocale

  if (!locale && !routerLocale) {
    console.error(`> next-translate-routes - No locale prop in Router: fallback to ${language}. Link props:`, {
      href,
      ...props,
    })
  }

  const translatedUrl = language ? translateUrl(as || href, language) : ''

  return <NextLink href={translatedUrl || href} as={translatedUrl || as} locale={locale} {...props} />
}

const enhanceNextRouter = ({ push, replace, prefetch, locale, ...otherRouterProps }: NextRouter): NextRouter => ({
  push: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedUrl =
      options?.locale || locale ? translateUrl(as || url, options?.locale || (locale as string)) : url
    return push(url, as || translatedUrl, options)
  },
  replace: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedUrl =
      options?.locale || locale ? translateUrl(as || url, options?.locale || (locale as string)) : url
    return replace(url, as || translatedUrl, options)
  },
  prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
    const translatedUrl =
      options?.locale || locale
        ? (translateUrl(asPath || inputUrl, options?.locale || (locale as string), { format: 'string' }) as string)
        : inputUrl
    return prefetch(inputUrl, asPath || translatedUrl, options)
  },
  locale,
  ...otherRouterProps,
})

/**
 * Get router with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next useRouter (`next/router`)
 */
export const useRouter = (): NextRouter => {
  const nextRouter = useNextRouter()
  return enhanceNextRouter(nextRouter)
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Inject router prop with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next withRouter (`next/router`)
 */
export const withRouter = <P extends Record<string, any>>(Component: ComponentType<{ router: NextRouter } & P>) =>
  Object.assign(
    (props: P) => {
      const router = useNextRouter()
      return <Component router={router} {...props} />
    },
    { displayName: `withRouter(${Component.displayName})` },
  )

/**
 * Must wrap the App component in `pages/_app`.
 * This HOC will make the route push, replace, and refetch functions able to translate routes.
 */
export const withTranslateRoutes = <A extends ComponentType<any>>(AppComponent: A) =>
  Object.assign(
    (props: any) => {
      const nextRouter = useNextRouter()
      const router = enhanceNextRouter(nextRouter)

      return (
        <RouterContext.Provider value={router}>
          <AppComponent {...{ ...props, router }} />
        </RouterContext.Provider>
      )
    },
    { displayName: `withTranslateRoutes(${AppComponent.displayName})` },
  )

export default withTranslateRoutes
