/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { createNtrData } from '../src/plugin/createNtrData'
import { getPageReRoutes, getRouteBranchReRoutes } from '../src/plugin/getRouteBranchReRoutes'
import { setNtrData } from '../src/shared/ntrData'
import allReRoutes from './fixtures/allReRoutes'
import reRoutesData from './fixtures/reRoutesData'
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
const translateRoutes = { debug: true }

describe('plugin.', () => {
  beforeAll(() => {
    process.env.npm_package_dependencies_next = '13.3.1'
  })

  test('createNtrData.', () => {
    const i18n = { locales: ['en', 'fr', 'fr-FR'], defaultLocale: 'en', fallbackLng: { 'fr-FR': ['fr'] } }
    const ntrData = createNtrData({ i18n, translateRoutes }, pagesPath)
    expect(ntrData.routesTree).toEqual(routesTree)
    expect(ntrData.locales).toEqual(i18n.locales)
    expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
    expect(ntrData.fallbackLng).toEqual(i18n.fallbackLng)
    expect(ntrData.debug).toBe(true)
  })

  test('getPageReRoutes.', () => {
    const { reRoutes, i18n, routeSegments } = reRoutesData
    setNtrData(createNtrData({ i18n, translateRoutes }, pagesPath))
    const pageReRoutes = getPageReRoutes(routeSegments)
    expect(pageReRoutes).toEqual(reRoutes)
  })

  test('getRouteBranchReRoutes.', () => {
    setNtrData(
      createNtrData({ i18n: { locales: ['en', 'fr', 'es'], defaultLocale: 'en' }, translateRoutes }, pagesPath),
    )
    const reRoutes = getRouteBranchReRoutes()
    expect(reRoutes).toEqual(allReRoutes)
  })
})
