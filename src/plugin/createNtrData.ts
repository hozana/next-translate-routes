import { defaultConfig } from 'next/dist/server/config-shared'

import type { NextConfigWithNTR, TNtrData } from '../types'
import { getPagesPath } from './getPagesPath'
import { parsePages } from './parsePages'

export const createNtrData = (
  {
    pageExtensions = defaultConfig.pageExtensions as string[],
    i18n: { defaultLocale, locales = [] },
    translateRoutes: { debug, routesDataFileName, routesTree: customRoutesTree, pagesDirectory } = {},
  }: NextConfigWithNTR,
  customPagesPath?: string,
): TNtrData => {
  const pagesPath = customPagesPath || getPagesPath(pagesDirectory)

  const routesTree = customRoutesTree || parsePages({ directoryPath: pagesPath, pageExtensions, routesDataFileName })
  // TODO: validateRoutesTree(routesTree)

  return {
    debug,
    defaultLocale,
    locales,
    routesTree,
  }
}

export default createNtrData
