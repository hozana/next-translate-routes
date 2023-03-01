import type { NextConfig } from 'next/dist/server/config-shared'

import type { NextConfigWithNTR, TNtrData } from '../types'
import { getPagesPath } from './getPagesPath'
import { parsePages } from './parsePages'

export const createNtrData = (nextConfig: NextConfig, customPagesPath?: string): TNtrData => {
  const {
    pageExtensions = ['js', 'ts', 'jsx', 'tsx'],
    i18n,
    translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory } = {},
  } = nextConfig as NextConfigWithNTR
  const pagesPath = customPagesPath || getPagesPath(pagesDirectory)

  const routesTree = customRoutesTree || parsePages({ directoryPath: pagesPath, pageExtensions, routesDataFileName })
  // TODO: validateRoutesTree(routesTree)

  return {
    debug,
    i18n,
    routesTree,
  }
}

export default createNtrData
