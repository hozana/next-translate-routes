/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { createNtrData } from '../../src/plugin/createNtrData'
import { getPageReRoutes, getRouteBranchReRoutes } from '../../src/plugin/getRouteBranchReRoutes'
import { setNtrData } from '../../src/shared/ntrData'
import allReRoutes from '../fixtures/allReRoutes'
import reRoutesData from '../fixtures/reRoutesData'

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
