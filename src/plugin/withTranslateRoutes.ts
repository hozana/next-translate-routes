import fs from 'fs'
import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { I18NConfig, NextConfig } from 'next/dist/server/config-shared'
import pathUtils from 'path'
import { Configuration as WebpackConfiguration } from 'webpack'

import { NTRConfig } from '../types'
import { getRouteBranchReRoutes } from './getRouteBranchReRoutes'
import { parsePages } from './parsePages'

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
export const withTranslateRoutes = ({
  translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory } = {},
  ...nextConfig
}: NextConfig & { i18n: I18NConfig; translateRoutes: NTRConfig }): NextConfig => {
  if (!nextConfig.i18n) {
    throw new Error(
      '[next-translate-routes] - No i18n config found in next.config.js. i18n config is mandatory to use next-translate-routes.\nSeehttps://nextjs.org/docs/advanced-features/i18n-routing',
    )
  }

  const pagesDir = ['pages', 'src/pages', 'app/pages', 'intergrations/pages', pagesDirectory].find(
    (dirPath) => dirPath && fs.existsSync(pathUtils.join(process.cwd(), dirPath)),
  )

  if (!pagesDir) {
    throw new Error('[next-translate-routes] - No pages folder found.')
  }

  const pagesPath = pathUtils.join(process.cwd(), pagesDir, '/')

  const {
    i18n: { defaultLocale, locales = [] },
    pageExtensions = ['js', 'jsx', 'ts', 'tsx'],
  } = nextConfig

  const routesTree = customRoutesTree || parsePages({ directoryPath: pagesPath, pageExtensions, routesDataFileName })
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
