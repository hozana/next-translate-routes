import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import { pathToRegexp } from 'path-to-regexp'

import { ignoreSegmentPathRegex } from '../shared/regex'
import type { TReRoutes, TRouteBranch, TRouteSegment } from '../types'
import { fileNameToPath } from './fileNameToPaths'
import { getLocalePathFromPaths } from './getPathFromPaths'

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
      .map(({ paths }) => getLocalePathFromPaths({ paths, locale }))
      .filter((pathPart) => pathPart && !ignoreSegmentPathRegex.test(pathPart))
      .join('/')}`

  /** File path in path-to-regexp syntax (cannot be customised in routes data files) */
  const basePath = `/${routeSegments
    .map(({ name, paths: { default: defaultPath } }) => {
      const match = defaultPath.match(ignoreSegmentPathRegex) || []
      // If a pattern is added to the ignore token ".", add it behind #ignorePattern
      return fileNameToPath(name) + (match[1] || '')
    })
    .filter(Boolean) // Filter out falsy values
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
    const { sourceLocales = [] as L[] } = acc.find((sourceItem) => sourceItem.source === source) || {}
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
              permanent: false,
              // Prevent prefetches redirection. See #49 and https://github.com/vercel/next.js/issues/39531
              missing: [
                {
                  type: 'header',
                  key: 'x-nextjs-data',
                },
              ],
            } as Redirect,
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
