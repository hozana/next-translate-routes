import React, { ComponentType } from 'react'
import NextLink, { LinkProps } from 'next/link'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { compile, parse as parsePath, Key } from 'path-to-regexp'
import { parse as parseQuery, stringify as stringifyQuery, ParsedUrlQuery } from 'querystring'
import { format as formatUrl, UrlObject } from 'url'

import type { TRouteBranch } from './types'
import type { PrefetchOptions } from 'next/dist/next-server/lib/router/router'

type TOptions = {
  /** For testing: this is not needed for regular use. */
  routes?: TRouteBranch
}
type Url = UrlObject | string

const routesTree = process.env.NEXT_PUBLIC_ROUTES as TRouteBranch

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
  lang,
  pathParts,
  routeBranch,
  query,
}: {
  lang: string
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
    return translatePathParts({ lang, pathParts: nextPathParts, routeBranch, query })
  }

  const candidates = getAllCandidates(lang, children).filter((child) =>
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
          translatedPathParts: [childRouteBranch.paths[lang] || childRouteBranch.paths.default],
          augmentedQuery: currentQuery,
        }
      }
      // No route match => return the remaining path as is
      return { translatedPathParts: pathParts, augmentedQuery: query }
    }
  }

  // Get the descendants translated path parts and query values
  const { augmentedQuery, translatedPathParts: nextTranslatedPathsParts } = childRouteBranch?.children
    ? translatePathParts({ lang, pathParts: nextPathParts, routeBranch: childRouteBranch, query: currentQuery })
    : { augmentedQuery: currentQuery, translatedPathParts: [] }

  const translatedPathPart = childRouteBranch.paths[lang] || childRouteBranch.paths.default

  return {
    translatedPathParts: [
      ...(translatedPathPart === '.' ? [] : [translatedPathPart]),
      ...(nextTranslatedPathsParts || []),
    ],
    augmentedQuery,
  }
}

export type TGenerateUrlProps = UrlObject & {
  pathname: string
  lang: string
  options: TOptions
}

export const generateUrl = ({
  pathname,
  lang,
  query,
  hash,
  options: { routes = routesTree },
}: TGenerateUrlProps): string => {
  const pathParts = pathname.replace(/^\//, '').split('/')
  const { translatedPathParts, augmentedQuery = {} } = translatePathParts({
    lang,
    pathParts,
    query: parseQuery(typeof query === 'string' ? query : stringifyQuery(query || {})),
    routeBranch: routes,
  })
  const path = translatedPathParts.join('/')
  const compiledPath = compile(path)(augmentedQuery)
  const paramsNames = (parsePath(path).filter((token) => typeof token === 'object') as Key[]).map((token) => token.name)
  const remainingQuery = Object.entries(augmentedQuery).reduce(
    (acc, [key, value]) => ({
      ...acc,
      ...(paramsNames.includes(key) ? {} : { [key]: value }),
    }),
    {},
  )
  const stringQuery = stringifyQuery(remainingQuery)
  return `/${compiledPath}${stringQuery ? `?${stringQuery}` : ''}${hash ? `#${hash}` : ''}`
}

export const translateUrl = (lang: string, href: Url | string[], options?: TOptions): Url => {
  const to = Array.isArray(href) ? `/${href.join('/')}` : href

  if (typeof to === 'object' && to.pathname) {
    return generateUrl({ ...to, lang, options } as TGenerateUrlProps)
  }

  if (typeof to === 'string' && !/^https?:\/\/|^www\./.exec(to)) {
    const [pathname, query, hash] = to.split(/[?#]/)
    const url = generateUrl({ pathname, query, hash, lang, options })
    return url
  }

  return to
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

export const Link: React.FC<LinkProps & { lang?: string }> = ({ href, lang, ...props }) => {
  const { locale, defaultLocale, locales } = useNextRouter()
  const language = lang || locale || defaultLocale || locales?.[0]

  if (!language) {
    throw new Error('No locale in router')
  }

  return <NextLink href={removeEmptyCatchAll(href)} as={translateUrl(language, href)} {...props} />
}

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

export const useRouter = (): Router => {
  const { push, replace, prefetch, ...otherRouterProps } = useNextRouter()
  const currentLang = otherRouterProps.locale || otherRouterProps.defaultLocale || otherRouterProps.locales?.[0]

  if (!currentLang) {
    throw new Error('No locale in router')
  }

  return {
    push: (url: Url, as?: Url, options?: TransitionOptions) =>
      push(removeEmptyCatchAll(url), as || translateUrl(options?.locale || currentLang, url), options),
    replace: (url: Url, as?: Url, options?: TransitionOptions) =>
      replace(removeEmptyCatchAll(url), as || translateUrl(options?.locale || currentLang, url), options),
    prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
      const newAsPath = asPath || translateUrl(options?.locale || currentLang, inputUrl)
      return prefetch(inputUrl, typeof newAsPath === 'object' ? formatUrl(newAsPath) : newAsPath, options)
    },
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
