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
import YAML from 'yamljs'
import { pathToRegexp } from 'path-to-regexp'
import { Configuration as WebpackConfiguration } from 'webpack'

import { ignoreSegmentPathRegex } from './translateUrl'

import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { I18NConfig, NextConfig } from 'next/dist/server/config-shared'
import type { TReRoutes, TRouteBranch, TRouteSegment, TRouteSegmentPaths, TRouteSegmentsData } from './types'

/** Keep 'routes.json' for backward compatibility */
const DEFAULT_ROUTES_DATA_FILE_NAMES = ['_routes', 'routes']

/** Transform Next file-system synthax to path-to-regexp synthax */
const fileNameToPath = (fileName: string) =>
  fileName
    .replace(/\[\[\.\.\.(\S+)\]\]/g, ':$1*') // [[...param]]
    .replace(/\[\.\.\.(\S+)\]/g, ':$1+') // [...param]
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

export type TParsePageTreeProps = {
  directoryPath: string
  pageExtensions: string[]
  isSubBranch?: boolean
  routesDataFileName?: string
}

/**
 * Recursively parse pages directory and build a page tree object
 */
export const parsePagesTree = <L extends string>({
  directoryPath,
  pageExtensions,
  isSubBranch,
  routesDataFileName,
}: TParsePageTreeProps): TRouteBranch<L> => {
  const directoryItems = fs.readdirSync(directoryPath)
  const routesFileName = directoryItems.find((directoryItem) => {
    const fileNameNoExt = directoryItem.match(/^(.+)\.(json|yaml)$/)?.[1]
    return (
      fileNameNoExt &&
      (routesDataFileName
        ? fileNameNoExt === routesDataFileName
        : DEFAULT_ROUTES_DATA_FILE_NAMES.includes(fileNameNoExt))
    )
  })
  const routeSegmentsFileContent = routesFileName
    ? fs.readFileSync(pathUtils.join(directoryPath, routesFileName), { encoding: 'utf8' })
    : ''
  const routeSegmentsData = routeSegmentsFileContent
    ? (/\.yaml$/.test(routesFileName as string) ? YAML : JSON).parse(routeSegmentsFileContent)
    : {}
  const directoryPathParts = directoryPath.replace(/[\\/]/, '').split(/[\\/]/)
  const name = isSubBranch ? directoryPathParts[directoryPathParts.length - 1] : ''

  const children = directoryItems.reduce((acc, item) => {
    const isDirectory = fs.statSync(pathUtils.join(directoryPath, item)).isDirectory()
    const pageMatch = item.match(new RegExp(`(.+)\\.(${pageExtensions.join('|')})$`))
    const pageName = (!isDirectory && pageMatch?.[1]) || ''

    if (!isSubBranch && (['_app', '_document', '_error', '404', '500'].includes(pageName) || item === 'api')) {
      return acc
    }

    if (isDirectory || pageName) {
      return [
        ...acc,
        isDirectory
          ? parsePagesTree({
              directoryPath: pathUtils.join(directoryPath, item),
              isSubBranch: true,
              pageExtensions,
              routesDataFileName,
            })
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
 * mergeOrRegex('(one|two|tree)', 'four') => '(one|two|tree|four)'
 * mergeOrRegex('(one|two|tree)', 'tree') => '(one|two|tree)'
 */
const mergeOrRegex = (existingRegex: string, newPossiblity: string) => {
  const existingPossibilities = existingRegex.replace(/\(|\)/g, '').split('|')
  return existingPossibilities.includes(newPossiblity)
    ? existingRegex
    : `(${[...existingPossibilities, newPossiblity].join('|')})`
}

/**
 * Get redirects and rewrites for a page
 */
export const getPageReRoutes = <L extends string>({
  locales,
  routeSegments,
  defaultLocale,
}: {
  locales: L[]
  routeSegments: TRouteSegment<L>[]
  defaultLocale?: L
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
    const destination = `${locale === defaultLocale ? '' : `/${locale}`}${sourceToDestination(localePath)}`

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
            const mergedWithSimilar = {
              ...similar,
              source: similar.source
                .split('/')
                .map((similarSegment, index) =>
                  sourceSegments[index] === similarSegment
                    ? similarSegment
                    : mergeOrRegex(similarSegment, sourceSegments[index]),
                )
                .join('/'),
            }

            // Avoid to merge path that would introduce redirect loop
            if (!pathToRegexp(mergedWithSimilar.source).test(destination)) {
              return [...acc.slice(0, similarIndex), mergedWithSimilar, ...acc.slice(similarIndex + 1)]
            }
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
  defaultLocale,
}: {
  locales: L[]
  routeBranch: TRouteBranch<L>
  previousRouteSegments?: TRouteSegment<L>[]
  defaultLocale?: L
}): TReRoutes => {
  const routeSegments = [...previousRouteSegments, routeSegment]

  return children
    ? children.reduce(
        (acc, child) => {
          const childReRoutes =
            child.name === 'index'
              ? getPageReRoutes({ locales, routeSegments, defaultLocale })
              : getRouteBranchReRoutes({
                  locales,
                  routeBranch: child,
                  previousRouteSegments: routeSegments,
                  defaultLocale,
                })
          return {
            redirects: [...acc.redirects, ...childReRoutes.redirects],
            rewrites: [...acc.rewrites, ...childReRoutes.rewrites],
          }
        },
        { redirects: [], rewrites: [] } as TReRoutes,
      )
    : getPageReRoutes({ locales, routeSegments, defaultLocale })
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

export type NTRConfig = {
  debug?: boolean
  routesDataFileName?: string
  routesTree?: TRouteBranch
  pagesDirectory?: string
}

/**
 * Inject translated routes
 */
export const withTranslateRoutes = ({
  translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory } = {},
  ...nextConfig
}: NextConfig & { i18n: I18NConfig; translateRoutes: NTRConfig }): NextConfig => {
  if (!nextConfig.i18n) {
    throw new Error(
      '[next-translate-routes] - No i18n config found in next.config.js. i18n config is mandatory to use next-translate-routes.\nSeehttps://nextjs.org/docs/advanced-features/i18n-routing',
    )
  }

  const pagesDir = ['pages', 'src/pages', 'app/pages', 'intergrations/pages', pagesDirectory].find((dirPath) =>
    fs.existsSync(pathUtils.join(process.cwd(), dirPath)),
  )

  if (!pagesDir) {
    throw new Error('[next-translate-routes] - No pages folder found.')
  }

  const pagesPath = pathUtils.join(process.cwd(), pagesDir, '/')

  const {
    i18n: { defaultLocale, locales = [] },
    pageExtensions = ['js', 'jsx', 'ts', 'tsx'],
  } = nextConfig

  const routesTree =
    customRoutesTree || parsePagesTree({ directoryPath: pagesPath, pageExtensions, routesDataFileName })
  // TODO: validateRoutesTree(routesTree)

  const { redirects, rewrites } = getRouteBranchReRoutes({ locales, routeBranch: routesTree, defaultLocale })
  const sortedRedirects = sortBySpecificity(redirects)
  const sortedRewrites = sortBySpecificity(rewrites)

  if (debug) {
    console.log('[next-translate-routes] - Redirects:', sortedRedirects)
    console.log('[next-translate-routes] - Rewrites:', sortedRewrites)
  }

  return {
    ...nextConfig,

    webpack(conf: WebpackConfiguration, options) {
      const config =
        typeof nextConfig.webpack === 'function' ? (nextConfig.webpack(conf, options) as WebpackConfiguration) : conf

      if (!config.module) {
        config.module = {}
      }
      if (!config.module.rules) {
        config.module.rules = []
      }
      config.module.rules.push({
        test: new RegExp(`_app\\.(${pageExtensions.join('|')})$`),
        use: {
          loader: 'next-translate-routes/loader',
          options: {
            pagesPath,
            data: {
              debug,
              defaultLocale,
              locales,
              routesTree,
            },
          },
        },
      })

      return config
    },

    async redirects() {
      const existingRedirects = (nextConfig.redirects && (await nextConfig.redirects())) || []
      return [...sortedRedirects, ...existingRedirects]
    },

    async rewrites() {
      const existingRewrites = (nextConfig.rewrites && (await nextConfig.rewrites())) || []
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
