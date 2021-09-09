/**
 * ## Vocabulary ##
 *
 * Paths:
 * - path: path in path-to-regexp syntax
 * - file path: path in the Next.js file system syntax
 * - base path: file path in path-to-regexp syntax
 * - translated path: file path translated in path-to-regexp syntax
 * - translated file path: translated file path
 * - default path: path of user specified default path values or, when empty, from file names translated into path-to-regexp syntax
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
import { ignoreSegmentPathRegex } from '.'

import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { NextConfig } from 'next/dist/server/config-shared'
import type { TReRoutes, TRouteBranch, TRouteSegment, TRouteSegmentPaths, TRouteSegmentsData } from './types'

const ROUTES_DATA_FILE_NAME = 'routes.json'

/** Transform Next file-system synthax to path-to-regexp synthax */
const fileNameToPath = (fileName: string) =>
  fileName
    .replace(/\[\[\.\.\.(\S+)\]\]/g, ':$1*') // [[...param]]
    .replace(/\[\.\.\.(\S+)\]/g, ':$1') // [...param]
    .replace(/\[(\S+)\]/g, ':$1') // [param]

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
  const directoryPathParts = dirPath.split(/[\\/]/)
  const name = !directoryPath || isTrunk ? '' : directoryPathParts[directoryPathParts.length - 1]

  const children = directoryItems.reduce((acc, item) => {
    const isDirectory = fs.statSync(pathUtils.join(dirPath, item)).isDirectory()
    const pageMatch = item.match(/(.+)\.[jt]sx?$/)
    const pageName = (!isDirectory && pageMatch?.[1]) || ''

    if (
      (isTrunk || !directoryPath) &&
      (['_app', '_document', '_error', '404', '500'].includes(pageName) || item === 'api')
    ) {
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

const staticSegmentRegex = /^[\w-_]+$|^\([\w-_|]+\)$/

/**
 * Find index of a similar redirect/rewrite
 * This is used to merge similar redirects and rewrites
 */
const getSimilarIndex = <R extends Redirect | Rewrite>(sourceSegments: string[], acc: R[]) =>
  acc.findIndex(({ source: otherSource }) => {
    const otherSourceSegments = otherSource.split('/')

    return (
      // source and otherSource must have the same segments number
      otherSourceSegments.length === sourceSegments.length &&
      // each corresponding source and otherSource segments should be compatible, which means that...
      sourceSegments.every((sourceSegment, index) => {
        const correspondingSegment = otherSourceSegments[index]
        return (
          // ...either they are equal
          sourceSegment === correspondingSegment ||
          // ...either they are both static
          (staticSegmentRegex.test(sourceSegment) && staticSegmentRegex.test(correspondingSegment))
        )
      })
    )
  })

/**
 * Get redirects and rewrites for a page
 */
export const getPageReRoutes = <L extends string>({
  locales,
  routeSegments,
}: {
  locales: L[]
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
      .filter((pathPart) => pathPart && !ignoreSegmentPathRegex.test(pathPart))
      .join('/')}`

  /** File path in path-to-regexp syntax (cannot be customised in routes data files) */
  const basePath = `/${routeSegments
    .map(({ name, paths: { default: defaultPath } }) => {
      const match = defaultPath.match(ignoreSegmentPathRegex) || []
      // If a pattern is added to the ignore token "."
      return fileNameToPath(name) + (match[1] || '')
    })
    .filter((pathPart) => pathPart)
    .join('/')}`

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
  const sourceList = locales.reduce((acc, locale) => {
    const source = getPath(locale)
    if (source === basePath) {
      return acc
    }
    const { sourceLocales = [] } = acc.find((sourceItem) => sourceItem.source === source) || {}
    return [
      ...acc.filter((sourceItem) => sourceItem.source !== source),
      { source, sourceLocales: [...sourceLocales, locale] },
    ]
  }, [] as { sourceLocales: L[]; source: string }[])

  const redirects = locales.reduce((acc, locale) => {
    const localePath = getPath(locale)
    const destination = `/${locale}${sourceToDestination(localePath)}`

    return [
      ...acc,
      ...sourceList
        .filter(({ sourceLocales }) => !sourceLocales.includes(locale))
        // Redirect from base path so that it does not display the page but only the translated path does
        .concat(...(localePath === basePath ? [] : [{ sourceLocales: [], source: basePath }]))
        .reduce((acc, { source: rawSource }) => {
          const source = `/${locale}${rawSource}`
          const sourceSegments = source.split('/')

          // Look for similar redirects
          const similarIndex = getSimilarIndex(sourceSegments, acc)

          // If similar redirect exist, merge the new one
          if (similarIndex >= 0) {
            const similar = acc[similarIndex]
            return [
              ...acc.slice(0, similarIndex),
              {
                ...similar,
                source: similar.source
                  .split('/')
                  .map((similarSegment, index) =>
                    similarSegment === sourceSegments[index]
                      ? similarSegment
                      : `(${similarSegment.replace(/\(|\)/g, '').split('|').concat(sourceSegments[index]).join('|')})`,
                  )
                  .join('/'),
              },
              ...acc.slice(similarIndex + 1),
            ]
          }

          // Else append the new redirect
          return [
            ...acc,
            {
              source,
              destination,
              locale: false as const,
              permanent: true,
            },
          ]
        }, [] as Redirect[])
        .filter(({ source, destination }) => sourceToDestination(source) !== destination),
    ]
  }, [] as Redirect[])

  const destination = sourceToDestination(basePath)

  const rewrites: Rewrite[] = sourceList.reduce((acc, { source }) => {
    if (sourceToDestination(source) === destination) {
      return acc
    }

    const sourceSegments = source.split('/')

    // Look for similar rewrites
    const similarIndex = getSimilarIndex(sourceSegments, acc)

    // If similar rewrite exist, merge the new one
    if (similarIndex >= 0) {
      const similar = acc[similarIndex]
      return [
        ...acc.slice(0, similarIndex),
        {
          ...similar,
          source: similar.source
            .split('/')
            .map((similarSegment, index) =>
              similarSegment === sourceSegments[index]
                ? similarSegment
                : `(${similarSegment.replace(/\(|\)/g, '').split('|').concat(sourceSegments[index]).join('|')})`,
            )
            .join('/'),
        },
        ...acc.slice(similarIndex + 1),
      ]
    }

    // Else append a new rewrite
    return [
      ...acc,
      {
        source,
        destination,
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
  routeBranch: { children, ...routeSegment },
  previousRouteSegments = [],
}: {
  locales: L[]
  routeBranch: TRouteBranch<L>
  previousRouteSegments?: TRouteSegment<L>[]
}): TReRoutes => {
  const routeSegments = [...previousRouteSegments, routeSegment]

  return children
    ? children.reduce(
        (acc, child) => {
          const childReRoutes =
            child.name === 'index'
              ? getPageReRoutes({ locales, routeSegments })
              : getRouteBranchReRoutes({
                  locales,
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
    : getPageReRoutes({ locales, routeSegments })
}

/**
 * Sort redirects and rewrites by descending specificity:
 * - first by descending number of regexp in source
 * - then by descending number of path segments
 */
const sortBySpecificity = <R extends Redirect | Rewrite>(rArray: R[]): R[] =>
  rArray.sort((a, b) => {
    if (a.source.includes(':') && !b.source.includes(':')) {
      return 1
    }
    if (!a.source.includes(':') && b.source.includes(':')) {
      return -1
    }

    return b.source.split('/').length - a.source.split('/').length
  })

/**
 * Inject translated routes
 */
export const withTranslateRoutes = (nextConfig: Partial<NextConfig>): NextConfig => {
  const { locales = [] } = nextConfig.i18n || {}
  const existingRoutesTree = nextConfig?.env?.NEXT_PUBLIC_ROUTES
  const routesTree = existingRoutesTree ? JSON.parse(existingRoutesTree) : parsePagesTree()
  const { redirects, rewrites } = getRouteBranchReRoutes({ locales, routeBranch: routesTree })
  // TODO: validateRoutesTree(routesTree)

  process.env.NEXT_PUBLIC_ROUTES = JSON.stringify(routesTree)
  process.env.NEXT_PUBLIC_LOCALES = nextConfig.i18n?.locales?.join(',') || ''
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE = nextConfig.i18n?.defaultLocale || ''

  return {
    ...nextConfig,

    async redirects() {
      const existingRedirects = (nextConfig.redirects && (await nextConfig.redirects())) || []
      return [...existingRedirects, ...sortBySpecificity(redirects)]
    },

    async rewrites() {
      const existingRewrites = (nextConfig.rewrites && (await nextConfig.rewrites())) || []
      const sortedRewrites = sortBySpecificity(rewrites)
      if (Array.isArray(existingRewrites)) {
        return [...existingRewrites, ...sortedRewrites]
      }
      return {
        ...existingRewrites,
        afterFiles: [...(existingRewrites.afterFiles || []), ...sortedRewrites],
      }
    },
  } as NextConfig
}
