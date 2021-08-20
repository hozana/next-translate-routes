import { getPageReRoutes, getRouteBranchReRoutes, parsePagesTree } from '../src/plugin'
import { translateUrl } from '../src'
import path from 'path'
import routesTree from './fixtures/routesTree.json'
import reRoutesData from './fixtures/reRoutesData.json'
import allReRoutes from './fixtures/allReRoutes.json'
import type { NEXT_DATA } from 'next/dist/next-server/lib/utils'

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
  const parsedPagesTree = parsePagesTree(pagesPath, true)
  // console.log('From test, parsedPagesTree:', JSON.stringify(parsedPagesTree, null, 4))
  expect(parsedPagesTree).toEqual(routesTree)
})

test('getPageReRoutes.', () => {
  const { reRoutes, ...getPageReRoutesProps } = reRoutesData
  const pageReRoutes = getPageReRoutes(getPageReRoutesProps)
  expect(pageReRoutes).toEqual(reRoutes)
})

test('getRouteBranchReRoutes.', () => {
  const reRoutes = getRouteBranchReRoutes({ locales: ['en', 'fr', 'es'], routeBranch: routesTree })
  expect(reRoutes).toEqual(allReRoutes)
})

test('translateHref.', () => {
  ;[
    {
      href: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
        hash: 'section',
      },
      expected: {
        pathname: '/communaute/300-three-hundred/statistiques',
        query: { baz: 3 },
        hash: 'section',
      },
    },
    {
      href: {
        pathname: '/communities/[[...tagSlug]]',
        query: { baz: 3 },
      },
      expected: {
        pathname: '/communautes',
        query: { baz: 3 },
      },
    },
    {
      href: '/community/300/three-hundred/statistics?baz=3#section',
      locale: 'en',
      expected: '/en/root/community/300-three-hundred/statistics?baz=3#section',
    },
    {
      href: '/feast-days?baz=3#section',
      expected: '/fetes?baz=3#section',
    },
    {
      href: '/feast-days/?baz=3#section',
      expected: '/fetes?baz=3#section',
    },
    {
      href: '/feast-days/foo/bar?baz=3#section',
      expected: '/fetes/foo/bar?baz=3#section',
    },
    {
      href: '/?baz=3#section',
      expected: '/?baz=3#section',
    },
  ].forEach(({ href, locale = 'fr', expected }) => {
    expect(translateUrl(href, locale || 'fr', { routes: routesTree, defaultLocale: 'fr' })).toEqual(expected)
  })
})
