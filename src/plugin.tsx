/**
 * ## Vocabulary ##
 *
 * Paths:
 * - path: path in path-to-regexp syntax
 * - file path: path in the Next.js file system syntax
 * - translated path: file path translated in path-to-regexp syntax
 * - translated file path: translated file path
 * - default path: path of user specified default values or, when empty, from file names translated into path-to-regexp syntax
 * - default locale path: translated path for default locale
 *
 * Routes:
 * - route segment data: data entered in the route data file for a segment
 *   It is either a path, either an object, with locales or "default" as keys and paths as values.
 * - route segments data: all the data entered in the route data file.
 *   It is an object with file names, or "/" for the containing folder, as keys and route segment data as values.
 * - route segment path: same as route segment data, but with the "default" value calculated from the file name it it did not exist
 * - route branch: route object with details and optionally children
 * - route tree: root route branch
 * - reroutes: object containing a redirects array and a rewrites array
 *
 * Translations:
 * - translations: object that associate a path segment translation to locales
 * - routesData: content of a routes file (object that associate translated path to file names)
 */

import fs from 'fs'
import pathUtils from 'path'

import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { NextConfig } from 'next/dist/next-server/server/config-shared'
import type { TReRoutes, TRouteBranch, TRouteSegment, TRouteSegmentPaths, TRouteSegmentsData } from './types'

const ROUTES_DATA_FILE_NAME = 'routes.json'

/** Transform Next file-system synthax to path-to-regexp synthax */
export const fileNameToPath = (fileName: string) =>
  fileName
    .replace(/\[\[\.\.\.(\S+)\]\]/g, ':$1*')
    .replace(/\[\.\.\.(\S+)\]/g, ':$1')
    .replace(/([^[]*)\[([\w\d]+?)\]/g, '{$1:$2}')

/** Get path and path translations from name and all translations */
const getRouteSegment = <L extends string>(
  name: string,
  routeSegmentsData: TRouteSegmentsData<L>,
  isDirectory?: boolean,
): TRouteSegment<L> => {
  const routeSegmentData = routeSegmentsData?.[isDirectory ? '/' : name]
  const { default: defaultPath = fileNameToPath(name), ...localized } =
    typeof routeSegmentData === 'object' ? routeSegmentData : { default: routeSegmentData }
  const paths = {
    default: defaultPath,
    ...localized,
  } as TRouteSegmentPaths<L>
  return {
    name,
    paths,
  }
}

/**
 * Recursively parse pages directory and build a page tree object
 */
export const parsePagesTree = <L extends string>(directoryPath?: string, isTrunk?: boolean): TRouteBranch<L> => {
  const dirPath = directoryPath || pathUtils.resolve(process.cwd(), 'pages')
  const directoryItems = fs.readdirSync(dirPath)
  const hasRoutesDataFile = directoryItems.find((directoryItem) => directoryItem === ROUTES_DATA_FILE_NAME)
  const routeSegmentsData = hasRoutesDataFile ? require(pathUtils.join(dirPath, ROUTES_DATA_FILE_NAME)) : {}
  const directoryPathParts = dirPath.split('/')
  const name = !directoryPath || isTrunk ? '' : directoryPathParts[directoryPathParts.length - 1]

  const children = directoryItems.reduce((acc, item) => {
    const isDirectory = fs.statSync(pathUtils.join(dirPath, item)).isDirectory()
    const pageMatch = item.match(/(.+)\.[jt]sx?$/)
    const pageName = !isDirectory ? pageMatch?.[1] : undefined

    if ((isTrunk || !directoryPath) && ['_app', '_document', '_error', '404', '500'].includes(pageName || '')) {
      return acc
    }

    if (isDirectory || pageName) {
      return [
        ...acc,
        isDirectory
          ? parsePagesTree(pathUtils.join(dirPath, item))
          : getRouteSegment(pageName || item, routeSegmentsData),
      ]
    }
    return acc
  }, [] as TRouteBranch<L>[])

  return {
    ...getRouteSegment(name, routeSegmentsData, true),
    children,
  }
}

/** Remove brackets and custom regexp from source to get valid destination */
const sourceToDestination = (sourcePath: string) =>
  sourcePath.replace(/[{}]|(:\w+)\([^)]+\)/g, (_match, arg) => arg || '')

/**
 * Get redirects and rewrites for a page
 */
export const getPageReRoutes = <L extends string>({
  locales,
  defaultLocale,
  routeSegments,
}: {
  locales: L[]
  defaultLocale?: L
  routeSegments: TRouteSegment<L>[]
}): TReRoutes => {
  /** If there is only one path possible: it is common to all locales and to files. No redirection nor rewrite is needed. */
  if (!routeSegments.some(({ paths }) => Object.keys(paths).length > 1)) {
    return { rewrites: [], redirects: [] }
  }

  /** Get a translated path or base path */
  const getPath = (locale: L | 'default') =>
    `/${routeSegments
      .map(({ paths }) => paths[locale] || paths.default)
      .filter((pathPart) => pathPart && pathPart !== '.')
      .join('/')}`

  /** File path in path-to-regexp syntax (cannot be customised in routes data files) */
  const basePath = `/${routeSegments
    .map(({ name }) => fileNameToPath(name))
    .filter((pathPart) => pathPart)
    .join('/')}`

  /**
   * ```
   * [
   *   { locales: ['default'], path: '/default/path' }, // Will often be common with the english or default locale path
   *   { locales: ['en'], path: '/english/path/without/locale/prefix' },
   *   { locales: ['fr'], path: '/chemin/francais/sans/prefixe/de/locale' },
   *   { locales: ['es', 'pt'], path: '/path/common/to/several/locales' },
   * ]
   * ```
   */
  const pathList = [...locales, 'default' as const].reduce((acc, locale) => {
    const path = getPath(locale)
    const { pathLocales: existingPathLocales = [] } = acc.find((pathItem) => pathItem.path === path) || {}
    return [
      ...acc.filter((pathItem) => pathItem.path !== path),
      { path, pathLocales: [...existingPathLocales, locale] },
    ]
  }, [] as { pathLocales: (L | 'default')[]; path: string }[])

  const redirects = locales.reduce((acc, locale) => {
    if (locale === 'default') {
      return acc
    }

    return [
      ...acc,
      ...pathList
        .filter((pathListItem) => !pathListItem.pathLocales.includes(locale))
        .map(
          (pathListItem) =>
            ({
              source: `/(${locale})${locale === defaultLocale ? '?' : ''}${pathListItem.path}`,
              destination: `${locale === defaultLocale ? '' : `/${locale}`}${sourceToDestination(getPath(locale))}`,
              locale: false,
              permanent: true,
            } as Redirect),
        ),
    ]
  }, [] as Redirect[])

  const rewrites: Rewrite[] = pathList.reduce((acc, { path, pathLocales }) => {
    const nonDefaultPathLocales = pathLocales.filter((pathLocale) => pathLocale !== 'default')
    const localePrefix =
      defaultLocale && pathLocales.includes(defaultLocale)
        ? ''
        : `/(${nonDefaultPathLocales.join('|')})${defaultLocale && pathLocales.includes(defaultLocale) ? '?' : ''}`

    const source = `${localePrefix}${path}`
    const destination = sourceToDestination(basePath)

    if (nonDefaultPathLocales.length === 0 || source === destination) {
      return acc
    }

    return [
      ...acc,
      {
        source,
        destination,
        ...(defaultLocale && pathLocales.includes(defaultLocale) ? {} : { locale: false }),
      },
    ]
  }, [] as Rewrite[])

  return { redirects, rewrites }
}

/**
 * Generate reroutes in route branch to feed the rewrite section of next.config
 */
export const getRouteBranchReRoutes = <L extends string>({
  locales,
  defaultLocale,
  routeBranch,
  routeBranch: { children },
  previousRouteSegments = [],
}: {
  locales: L[]
  defaultLocale?: L
  routeBranch: TRouteBranch<L>
  previousRouteSegments?: TRouteSegment<L>[]
}): TReRoutes => {
  const { children: _unused, ...routeSegment } = routeBranch
  const routeSegments = [...previousRouteSegments, routeSegment]

  return children
    ? children.reduce(
        (acc, child) => {
          const childReRoutes =
            child.name === 'index'
              ? getPageReRoutes({ locales, defaultLocale, routeSegments })
              : getRouteBranchReRoutes({
                  locales,
                  defaultLocale,
                  routeBranch: child,
                  previousRouteSegments: routeSegments,
                })
          return {
            redirects: [...acc.redirects, ...childReRoutes.redirects],
            rewrites: [...acc.rewrites, ...childReRoutes.rewrites],
          }
        },
        { redirects: [], rewrites: [] } as TReRoutes,
      )
    : getPageReRoutes({ locales, defaultLocale, routeSegments })
}

/**
 * Inject translated routes
 */
const withTranslateRoutes = (nextConfig: Partial<NextConfig>): NextConfig => {
  const { locales = [], defaultLocale } = nextConfig.i18n || {}
  const existingRoutesTree = nextConfig?.env?.NEXT_PUBLIC_ROUTES
  const routesTree = existingRoutesTree ? JSON.parse(existingRoutesTree) : parsePagesTree()
  const { redirects, rewrites } = getRouteBranchReRoutes({ locales, defaultLocale, routeBranch: routesTree })
  // TODO: validateRoutesTree(routesTree)

  return {
    ...nextConfig,

    env: {
      ...nextConfig.env,
      NEXT_PUBLIC_ROUTES: routesTree,
    },

    async redirects() {
      const existingRedirects = (nextConfig.redirects && (await nextConfig.redirects())) || []
      return [
        ...existingRedirects,
        ...redirects,
        {
          source: `/${defaultLocale}/:path*`,
          destination: '/:path*',
          permanent: true,
        },
      ]
    },

    async rewrites() {
      const existingRewrites = (nextConfig.rewrites && (await nextConfig.rewrites())) || []
      if (Array.isArray(existingRewrites)) {
        return [...existingRewrites, ...rewrites]
      }
      return {
        ...existingRewrites,
        beforeFiles: [...(existingRewrites.beforeFiles || []), ...rewrites],
      }
    },
  } as NextConfig
}

export default withTranslateRoutes
