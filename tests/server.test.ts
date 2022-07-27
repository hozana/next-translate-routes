/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { getPageReRoutes, getRouteBranchReRoutes } from '../src/server/getRouteBranchReRoutes'
import { parsePages } from '../src/server/parsePages'
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
test('parsePagesTree.', () => {
  const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')
  const parsedPagesTree = parsePages({ directoryPath: pagesPath, pageExtensions: ['tsx', 'jsx', 'ts', 'js'] })
  expect(parsedPagesTree).toEqual(routesTree)
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
