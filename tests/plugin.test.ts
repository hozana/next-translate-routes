/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { createNtrData } from '../src/plugin/createNtrData'
import { getPageReRoutes, getRouteBranchReRoutes } from '../src/plugin/getRouteBranchReRoutes'
import { setNtrData } from '../src/react/ntrData'
import allReRoutes from './fixtures/allReRoutes.json'
import reRoutesData from './fixtures/reRoutesData.json'
import routesTree from './fixtures/routesTree.json'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __NEXT_DATA__: Partial<NEXT_DATA>
    }
  }
}

const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')
const i18n = { locales: ['en', 'fr'], defaultLocale: 'en' }
const ntrData = createNtrData({ i18n, translateRoutes: { debug: true } }, pagesPath)

test('createNtrData.', () => {
  expect(ntrData.routesTree).toEqual(routesTree)
  expect(ntrData.i18n.locales).toEqual(i18n.locales)
  expect(ntrData.i18n.defaultLocale).toEqual(i18n.defaultLocale)
  expect(ntrData.debug).toBe(true)
})

test('getPageReRoutes.', () => {
  setNtrData(ntrData)
  const { reRoutes, ...getPageReRoutesProps } = reRoutesData
  const pageReRoutes = getPageReRoutes(getPageReRoutesProps)
  expect(pageReRoutes).toEqual(reRoutes)
})

test('getRouteBranchReRoutes.', () => {
  setNtrData({ ...ntrData, i18n: { locales: ['en', 'fr', 'es'], defaultLocale: 'fr' } })
  const reRoutes = getRouteBranchReRoutes({ routeBranch: { ...routesTree, paths: { default: '' } } })
  expect(reRoutes).toEqual(allReRoutes)
})
