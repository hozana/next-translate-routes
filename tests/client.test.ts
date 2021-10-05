/**
 * @jest-environment jsdom
 */

import { translatePath, translateUrl } from '../src'
import routesTree from './fixtures/routesTree.json'

describe('translate.', () => {
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
    {
      href: 'https://next-translate-routes.com/en/root/feast-days/foo/bar?baz=3#section',
      locale: 'en',
      translatedPath: 'https://next-translate-routes.com/root/feast-days/foo/bar?baz=3#section',
      translatedUrl: 'https://next-translate-routes.com/en/root/feast-days/foo/bar?baz=3#section',
    },
    {
      href: 'https://hozana.org/communautes',
      locale: 'en',
      translatedUrl: 'https://hozana.org/communautes',
    },
  ].forEach(({ href, locale = 'fr', translatedPath, translatedUrl }) => {
    const args = [
      href,
      locale || 'fr',
      { routesTree, locales: ['fr', 'en', 'es', 'pt'] as string[], defaultLocale: 'fr' },
    ] as const
    test(typeof href === 'string' ? href : href.pathname, () => {
      expect(translateUrl(...args)).toEqual(translatedUrl || translatedPath)
      if (translatedPath) {
        expect(translatePath(...args)).toEqual(translatedPath)
      }
    })
  })

  windowSpy.mockRestore()
})
