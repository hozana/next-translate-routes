/**
 * @jest-environment jsdom
 */
import type { UrlObject } from 'url'

import { fileUrlToUrl } from '../../src/react/fileUrlToUrl'
import { setEnvData } from './setEnvData'

describe('fileUrlToUrl', () => {
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

  const testDataItems: { urlObject: UrlObject & { pathname: string }; translation: string; locale?: string }[] = [
    {
      urlObject: {
        pathname: '/',
        query: { baz: 3 },
        hash: 'section',
      },
      translation: '?baz=3#section',
    },
    {
      urlObject: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
        hash: 'section',
      },
      translation: '/communaute/300-three-hundred/statistiques?baz=3#section',
    },
    {
      urlObject: {
        pathname: '/communities/[[...tagSlug]]',
        query: { baz: 3 },
      },
      translation: '/communautes?baz=3',
    },
    {
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
      translation: '/actualites/a',
    },
    {
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a', 'b'] },
      },
      translation: '/actualites/a/b',
    },
    {
      urlObject: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: 'a' },
      },
      translation: '/actualites/a',
    },
    {
      urlObject: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { path: [], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translation: '/root/catch-all-or-none?baz=3#section',
    },
    {
      urlObject: {
        pathname: '/catch-all/[...path]',
        query: { path: ['foo', 'bar'], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translation: '/root/catch-all/foo/bar?baz=3#section',
    },
  ]
  testDataItems.forEach(({ urlObject, translation, locale = 'fr' }) => {
    const titleInput = JSON.stringify(urlObject)
    test(`fileUrlToUrl: ${titleInput}`, () => {
      expect(fileUrlToUrl(urlObject, locale)).toEqual(translation)
    })
  })

  windowSpy.mockRestore()
})
