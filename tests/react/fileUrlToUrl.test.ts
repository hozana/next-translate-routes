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

  const testDataItems: { url: string | (UrlObject & { pathname: string }); translation: string; locale?: string }[] = [
    {
      url: {
        pathname: '/',
        query: { baz: 3 },
        hash: 'section',
      },
      translation: '?baz=3#section',
    },
    {
      url: {
        pathname: '/community/[communityId]/[communitySlug]/statistics',
        query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
        hash: 'section',
      },
      translation: '/communaute/300-three-hundred/statistiques?baz=3#section',
    },
    {
      url: {
        pathname: '/communities/[[...tagSlug]]',
        query: { baz: 3 },
      },
      translation: '/communautes?baz=3',
    },
    {
      url: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
      translation: '/actualites/a',
    },
    {
      url: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a'] },
      },
      locale: 'fr-BE',
      translation: '/actualites/a',
    },
    {
      url: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: ['a', 'b'] },
      },
      translation: '/actualites/a/b',
    },
    {
      url: {
        pathname: '/news/[...newsPathPart]',
        query: { newsPathPart: 'a' },
      },
      translation: '/actualites/a',
    },
    {
      url: {
        pathname: '/catch-all-or-none/[[...path]]',
        query: { path: [], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translation: '/root/catch-all-or-none?baz=3#section',
    },
    {
      url: {
        pathname: '/catch-all/[...path]',
        query: { path: ['foo', 'bar'], baz: 3 },
        hash: 'section',
      },
      locale: 'en',
      translation: '/root/catch-all/foo/bar?baz=3#section',
    },
    {
      url: '/catch-all/stuff',
      locale: 'fr',
      translation: '/tout/stuff',
    },
  ]
  testDataItems.forEach(({ url: urlObject, translation, locale = 'fr' }) => {
    const titleInput = JSON.stringify(urlObject)
    test(`fileUrlToUrl: ${titleInput}`, () => {
      expect(fileUrlToUrl(urlObject, locale)).toEqual(translation)
    })
  })

  windowSpy.mockRestore()
})
