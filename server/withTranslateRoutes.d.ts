import type { I18NConfig, NextConfig } from 'next/dist/server/config-shared'

import { NTRConfig } from '../types'

/**
 * Inject translated routes
 */
export declare const withTranslateRoutes: ({
  translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory },
  ...nextConfig
}: NextConfig & {
  i18n: I18NConfig
  translateRoutes: NTRConfig
}) => NextConfig
