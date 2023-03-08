// import type { NextConfig } from 'next/dist/server/config-shared'
import type { NextConfigWithNTR, NTRNextConfig, TFallbackLng, TNtrData } from '../types'
import { getPagesPath } from './getPagesPath'
import { parsePages } from './parsePages'

export const createNtrData = (nextConfig: NTRNextConfig, customPagesPath?: string): TNtrData => {
  const {
    pageExtensions = ['js', 'ts', 'jsx', 'tsx'],
    i18n: { defaultLocale, locales = [], fallbackLng = {} },
    translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory } = {},
  } = nextConfig as NextConfigWithNTR
  const pagesPath = customPagesPath || getPagesPath(pagesDirectory)

  const routesTree = customRoutesTree || parsePages({ directoryPath: pagesPath, pageExtensions, routesDataFileName })
  // TODO: validateRoutesTree(routesTree)

  // TODO: construct fallbackLng

  return {
    debug,
    defaultLocale,
    locales,
    routesTree,
    fallbackLng,
  }
}

export default createNtrData
