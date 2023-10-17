/**
 * @jest-environment jsdom
 */
import type { UrlObject } from 'url'

import { urlToFileUrl } from '../../src/react/urlToFileUrl'
import { setEnvData } from './setEnvData'

describe('urlToFileUrl', () => {
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

  const testDataItems: { url: string | URL | UrlObject; urlObject: UrlObject | undefined; locale?: string }[] = [
    {
      url: {
        pathname: '/communaute/300-three-hundred/statistiques',
        query: { baz: 3 },
        hash: '#section',
      },
      urlObject: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: '300', communitySlug: 'three-hundred', baz: 3 },
        hash: '#section',
      },
    },
    {
      url: {
        pathname: '/communaute/300-three-hundred/statistiques',
        query: { baz: 3 },
        hash: '#section',
      },
      urlObject: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: '300', communitySlug: 'three-hundred', baz: 3 },
        hash: '#section',
      },
      locale: 'fr-BE',
    },
    {
      url: {
        pathname: '/en/root/community/300-three-hundred/statistics',
        query: { baz: 3 },
        hash: '#section',
      },
      urlObject: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: '300', communitySlug: 'three-hundred', baz: 3 },
        hash: '#section',
      },
      locale: 'en',
    },
    {
      url: {
        pathname: '/communautes',
        query: { baz: 3 },
      },
      urlObject: {
        pathname: '/communities/[[...tagSlug]]',
        query: { baz: 3, tagSlug: [] },
      },
    },
    {
      url: {
        pathname: '/actualites/a',
        query: {},
      },
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
    },
    {
      url: {
        pathname: '/actualites/a/b',
        query: {},
      },
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a', 'b'] },
      },
    },
    {
      url: '/news/a/b',
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a', 'b'] },
      },
      locale: 'en',
    },
    {
      url: {
        pathname: '/actualites/a',
        query: {},
      },
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
    },
    {
      url: '/?baz=3#section',
      urlObject: {
        pathname: '/',
        query: { baz: '3' },
        hash: '#section',
      },
    },
    {
      url: '/en/root/catch-all-or-none?baz=3#section',
      urlObject: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { path: [], baz: '3' },
        hash: '#section',
      },
      locale: 'en',
    },
    {
      url: '/en/root/catch-all/foo/bar?baz=3#section',
      locale: 'en',
      urlObject: {
        pathname: '/catch-all/[...path]',
        query: { path: ['foo', 'bar'], baz: '3' },
        hash: '#section',
      },
    },
    {
      url: {
        pathname: '/tout-ou-rien',
        query: { path: [], baz: 3 },
        hash: '#section',
      },
      locale: 'fr',
      urlObject: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { baz: 3, path: [] },
        hash: '#section',
      },
    },
    {
      url: '/en/root/catch-all-or-none/foo/bar?baz=3#section',
      locale: 'en',
      urlObject: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { path: ['foo', 'bar'], baz: '3' },
        hash: '#section',
      },
    },
    {
      url: {
        pathname: '/root/catch-all/foo/bar',
        query: { baz: 3 },
        hash: '#section',
      },
      urlObject: {
        pathname: '/catch-all/[...path]',
        query: { path: ['foo', 'bar'], baz: 3 },
        hash: '#section',
      },
      locale: 'en',
    },
    {
      url: 'https://next-translate-routes.com/en/root/catch-all/foo/bar?baz=3#section',
      locale: 'en',
      urlObject: {
        pathname: '/catch-all/[...path]',
        query: { baz: '3', path: ['foo', 'bar'] },
        hash: '#section',
      },
    },
    {
      url: 'https://hozana.org/communautes',
      locale: 'fr',
      urlObject: {
        pathname: '/communities/[[...tagSlug]]',
        query: { tagSlug: [] },
      },
    },
    {
      url: {
        pathname: '/communities/[[...tagSlug]]',
        query: { tagSlug: [] },
      },
      urlObject: {
        pathname: '/communities/[[...tagSlug]]',
        query: { tagSlug: [] },
      },
      locale: 'en',
    },
    {
      url: '/communaute/300/statistiques',
      urlObject: { pathname: '/[...anyPathPart]', query: { anyPathPart: ['communaute', '300', 'statistiques'] } },
      locale: 'fr',
    },
  ]

  testDataItems.forEach(({ url, urlObject, locale }) => {
    test(`urlToFileUrl: ${typeof url === 'string' ? url : JSON.stringify(url)}`, () => {
      expect(urlToFileUrl(url, locale)).toEqual(urlObject)
    })
  })

  windowSpy.mockRestore()
})
