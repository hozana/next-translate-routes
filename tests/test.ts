import { getPageReRoutes, getRouteBranchReRoutes, parsePagesTree } from '../src/config'
import { translatePath, translateUrl } from '../src'
import path from 'path'
import routesTree from './fixtures/routesTree.json'
import reRoutesData from './fixtures/reRoutesData.json'
import allReRoutes from './fixtures/allReRoutes.json'
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'

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

test('translate.', () => {
  ;[
    {
      href: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
        hash: 'section',
      },
      translatedPath: {
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
      translatedPath: {
        pathname: '/communautes',
        query: { baz: 3 },
      },
    },
    {
      href: '/community/300/three-hundred/statistics?baz=3#section',
      locale: 'en',
      translatedPath: '/root/community/300-three-hundred/statistics?baz=3#section',
      translatedUrl: '/en/root/community/300-three-hundred/statistics?baz=3#section',
    },
    {
      href: '/feast-days?baz=3#section',
      translatedPath: '/fetes?baz=3#section',
    },
    {
      href: '/feast-days/?baz=3#section',
      translatedPath: '/fetes?baz=3#section',
    },
    {
      href: '/feast-days/foo/bar?baz=3#section',
      translatedPath: '/fetes/foo/bar?baz=3#section',
    },
    {
      href: '/?baz=3#section',
      translatedPath: '/?baz=3#section',
    },
    {
      href: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translatedPath: {
        pathname: '/root/community/300-three-hundred/statistics',
        query: { baz: 3 },
        hash: 'section',
      },
      translatedUrl: {
        pathname: '/en/root/community/300-three-hundred/statistics',
        query: { baz: 3 },
        hash: 'section',
      },
    },
    {
      href: '/en/root/feast-days/foo/bar?baz=3#section',
      locale: 'en',
      translatedPath: '/root/feast-days/foo/bar?baz=3#section',
      translatedUrl: '/en/root/feast-days/foo/bar?baz=3#section',
    },
  ].forEach(({ href, locale = 'fr', translatedPath, translatedUrl }) => {
    const args = [
      href,
      locale || 'fr',
      { routesTree, locales: ['fr', 'en', 'es', 'pt'] as string[], defaultLocale: 'fr' },
    ] as const
    expect(translatePath(...args)).toEqual(translatedPath)
    expect(translateUrl(...args)).toEqual(translatedUrl || translatedPath)
  })
})
