/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { createNtrData } from '../src/plugin/createNtrData'
import { getPageReRoutes, getRouteBranchReRoutes } from '../src/plugin/getRouteBranchReRoutes'
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
test('createNtrData.', () => {
  const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')
  const i18n = { locales: ['en', 'fr'], defaultLocale: 'en' }
  const ntrData = createNtrData({ i18n, translateRoutes: { debug: true } }, pagesPath)
  expect(ntrData.routesTree).toEqual(routesTree)
  expect(ntrData.locales).toEqual(i18n.locales)
  expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
  expect(ntrData.debug).toBe(true)
})

test('createNtrDataFallbackLang.', () => {
  const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')
  const i18n = { locales: ['en', 'fr', 'fr-FR'], defaultLocale: 'en', fallbackLng: { 'fr-FR': ['fr'] } }
  const ntrData = createNtrData({ i18n, translateRoutes: { debug: true } }, pagesPath)
  expect(ntrData.routesTree).toEqual(routesTree)
  expect(ntrData.locales).toEqual(i18n.locales)
  expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
  expect(ntrData.debug).toBe(true)
})

test('getPageReRoutes.', () => {
  const { reRoutes, ...getPageReRoutesProps } = reRoutesData
  const pageReRoutes = getPageReRoutes(getPageReRoutesProps)
  expect(pageReRoutes).toEqual(reRoutes)
})

test('getRouteBranchReRoutes.', () => {
  const reRoutes = getRouteBranchReRoutes({
    locales: ['en', 'fr', 'es'],
    routeBranch: { ...routesTree, paths: { default: '' } },
  })
  expect(reRoutes).toEqual(allReRoutes)
})
