import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { NextConfig } from 'next/dist/server/config-shared'
import type { Configuration as WebpackConfiguration, FileCacheOptions } from 'webpack'

import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import { NextConfigWithNTR } from '../types'
import { createNtrData } from './createNtrData'
import { getPagesPath } from './getPagesPath'
import { getRouteBranchReRoutes } from './getRouteBranchReRoutes'
import { getAllRoutesFiles } from './routesFiles'

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
export const withTranslateRoutes = (userNextConfig: NextConfigWithNTR): NextConfig => {
  const { translateRoutes: { debug, pagesDirectory } = {}, ...nextConfig } = userNextConfig

  if (!nextConfig.i18n) {
    throw new Error(
      ntrMessagePrefix +
        'No i18n config found in next.config.js. i18n config is mandatory to use next-translate-routes.\nSeehttps://nextjs.org/docs/advanced-features/i18n-routing',
    )
  }

  const pagesPath = getPagesPath(pagesDirectory)

  const ntrData = createNtrData(userNextConfig, pagesPath)

  const { routesTree, locales, defaultLocale } = ntrData

  const { redirects, rewrites } = getRouteBranchReRoutes({ locales, routeBranch: routesTree, defaultLocale })
  const sortedRedirects = sortBySpecificity(redirects)
  const sortedRewrites = sortBySpecificity(rewrites)

  if (debug) {
    console.log(ntrMessagePrefix + 'Redirects:', sortedRedirects)
    console.log(ntrMessagePrefix + 'Rewrites:', sortedRewrites)
  }

  return {
    ...nextConfig,

    webpack(conf: WebpackConfiguration, context) {
      const config =
        typeof nextConfig.webpack === 'function' ? (nextConfig.webpack(conf, context) as WebpackConfiguration) : conf

      config.cache = typeof config.cache === 'object' ? (config.cache as FileCacheOptions) : { type: 'filesystem' }
      config.cache.buildDependencies = config.cache.buildDependencies || {}
      config.cache.buildDependencies.ntrRoutes = getAllRoutesFiles()

      if (!config.module) {
        config.module = {}
      }
      if (!config.module.rules) {
        config.module.rules = []
      }
      config.module.rules.push({
        test: new RegExp(
          `${pagesPath.replace(/\\|\//g, '(\\\\|\\/)')}_app\\.(${context.config.pageExtensions.join('|')})$`,
        ),
        use: {
          loader: 'next-translate-routes/loader',
          options: {
            data: ntrData,
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
