import { getPageReRoutes, getRouteBranchReRoutes, parsePagesTree } from '../src/plugin'
import { translateUrl } from '../src'
import path from 'path'
import routesTree from './fixtures/routesTree.json'
import reRoutesData from './fixtures/reRoutesData.json'
import allReRoutes from './fixtures/allReRoutes.json'

test('parsePagesTree.', () => {
  const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')
  const parsedPagesTree = parsePagesTree(pagesPath, true)
  // console.log('From test, parsedPagesTree:', JSON.stringify(parsedPagesTree, null, 4))
  expect(parsedPagesTree).toEqual(routesTree)
})

test('getPageReRoutes.', () => {
  const { reRoutes, ...getPageReRoutesProps } = reRoutesData
  const pageReRoutes = getPageReRoutes(getPageReRoutesProps)
  // console.log('From test, getPageReRoutes:', JSON.stringify(pageReRoutes, null, 4))
  expect(pageReRoutes).toEqual(reRoutes)
})

test('getRouteBranchReRoutes.', () => {
  const reRoutes = getRouteBranchReRoutes({ locales: ['en', 'fr', 'es'], defaultLocale: 'fr', routeBranch: routesTree })
  // console.log('From test, getRouteBranchReRoutes:', JSON.stringify(reRoutes, null, 4))
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
      expected: '/communaute/300-three-hundred/statistiques?baz=3#section',
    },
    {
      href: '/community/300/three-hundred/statistics?baz=3#section',
      expected: '/communaute/300-three-hundred/statistiques?baz=3#section',
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
  ].forEach(({ href, expected }) => {
    expect(translateUrl('fr', href, { routes: routesTree })).toEqual(expected)
  })
})
