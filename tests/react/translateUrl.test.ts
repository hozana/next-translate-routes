/**
 * @jest-environment jsdom
 */
import { translatePath, translateUrl } from '../../src/react/translateUrl'
import { setEnvData } from './setEnvData'

describe('translate', () => {
  beforeEach(() => {
    setEnvData()
  })

  const windowSpy = jest.spyOn(window, 'window', 'get')
  windowSpy.mockImplementation(
    () =>
      ({
        location: {
          host: 'next-translate-routes.com',
          hostname: 'next-translate-routes.com',
          href: 'https://next-translate-routes.com/current/path',
          origin: 'https://next-translate-routes.com',
          pathname: '/current/path',
        } as Window['location'],
      } as Window & typeof globalThis),
  )
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
      href: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
      translatedPath: {
        pathname: '/actualites/a',
        query: {},
      },
    },
    {
      href: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a', 'b'] },
      },
      translatedPath: {
        pathname: '/actualites/a/b',
        query: {},
      },
    },
    {
      href: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: 'a' },
      },
      translatedPath: {
        pathname: '/actualites/a',
        query: {},
      },
    },
    {
      href: '/news/a/b',
      translatedPath: '/actualites/a/b',
    },
    {
      href: '/news/a',
      translatedPath: '/actualites/a',
    },
    {
      href: '/community/300/three-hundred/statistics?baz=3#section',
      locale: 'en',
      translatedPath: '/root/community/300-three-hundred/statistics?baz=3#section',
      translatedUrl: '/en/root/community/300-three-hundred/statistics?baz=3#section',
    },
    {
      href: '/?baz=3#section',
      translatedPath: '/?baz=3#section',
    },
    {
      href: {
        pathname: '/en/community/[communityId]/[communitySlug]/statistics',
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
        pathname: '/root/community/300-three-hundred/statistics',
        query: { baz: 3 },
        hash: 'section',
      },
    },
    {
      href: '/catch-all/foo/bar?baz=3#section',
      translatedPath: '/tout/foo/bar?baz=3#section',
    },
    {
      href: '/en/root/catch-all-or-none?baz=3#section',
      locale: 'en',
      translatedPath: '/root/catch-all-or-none?baz=3#section',
      translatedUrl: '/en/root/catch-all-or-none?baz=3#section',
    },
    {
      href: '/en/root/catch-all/foo/bar?baz=3#section',
      locale: 'en',
      translatedPath: '/root/catch-all/foo/bar?baz=3#section',
      translatedUrl: '/en/root/catch-all/foo/bar?baz=3#section',
    },
    {
      href: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { path: [], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translatedPath: {
        pathname: '/root/catch-all-or-none',
        query: { baz: 3 },
        hash: 'section',
      },
      translatedUrl: {
        pathname: '/root/catch-all-or-none',
        query: { baz: 3 },
        hash: 'section',
      },
    },
    {
      href: '/en/root/catch-all/foo/bar?baz=3#section',
      locale: 'en',
      translatedPath: '/root/catch-all/foo/bar?baz=3#section',
      translatedUrl: '/en/root/catch-all/foo/bar?baz=3#section',
    },
    {
      href: {
        pathname: '/catch-all/[...path]',
        query: { path: ['foo', 'bar'], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translatedPath: {
        pathname: '/root/catch-all/foo/bar',
        query: { baz: 3 },
        hash: 'section',
      },
      translatedUrl: {
        pathname: '/root/catch-all/foo/bar',
        query: { baz: 3 },
        hash: 'section',
      },
    },
    {
      href: 'https://next-translate-routes.com/en/root/catch-all-or-none/foo/bar?baz=3#section',
      locale: 'en',
      translatedPath: 'https://next-translate-routes.com/root/catch-all-or-none/foo/bar?baz=3#section',
      translatedUrl: 'https://next-translate-routes.com/en/root/catch-all-or-none/foo/bar?baz=3#section',
    },
    {
      href: 'https://hozana.org/communautes',
      locale: 'en',
      translatedUrl: 'https://hozana.org/communautes',
    },
  ].forEach(({ href, locale = 'fr', translatedPath, translatedUrl }) => {
    const args = [href, locale || 'fr'] as const
    const titleInput = typeof href === 'string' ? href : JSON.stringify(href)
    test(`translateUrl: ${titleInput}`, () => {
      if (translatedPath) {
        expect(translatePath(...args)).toEqual(translatedPath)
      }
      expect(translateUrl(...args)).toEqual(translatedUrl || translatedPath)
    })
  })

  windowSpy.mockRestore()
})
