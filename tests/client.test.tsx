/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render } from '@testing-library/react'
import { RouterContext } from 'next/dist/shared/lib/router-context'

import { removeLangPrefix, translatePath, translateUrl } from '../src/translateUrl'
import { Link } from '../link'
import routesTree from './fixtures/routesTree.json'

import type { TNtrData } from '../src/types'

const defaultNtrData = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es', 'pt'],
  routesTree,
}

declare global {
  interface Window {
    __NTR_DATA__: import('../src/types').TNtrData
  }
}

const setEnvData = (ntrData: Partial<TNtrData> = {}) => {
  window.__NTR_DATA__ = {
    ...defaultNtrData,
    ...ntrData,
  }
}

beforeEach(() => {
  setEnvData()
})

describe('removeLangPrefix', () => {
  test('with non default locale prefix and root prefix to array', () => {
    expect(removeLangPrefix('/en/root/any/path', true)).toEqual(['any', 'path'])
  })
  test('with root prefix only on default locale', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/root/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix and root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/en/root/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that should have a root prefix but that is not here', () => {
    expect(removeLangPrefix('/en/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('without locale prefix', () => {
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
  test('without locale prefix when default locale has a root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
})

describe('translate', () => {
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
    const args = [href, locale || 'fr'] as const
    const pathname = typeof href === 'string' ? href : href.pathname
    test(`translateUrl: ${pathname}`, () => {
      expect(translateUrl(...args)).toEqual(translatedUrl || translatedPath)
      if (translatedPath) {
        expect(translatePath(...args)).toEqual(translatedPath)
      }
    })
    if (translatedPath) {
      test(`translatePath: ${pathname}`, () => {
        expect(translatePath(...args)).toEqual(translatedPath)
      })
    }
  })

  windowSpy.mockRestore()
})

describe('Link', () => {
  const push = jest.fn(() => Promise.resolve(true))
  beforeEach(() => push.mockClear())

  test('with no locale', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr'],
          defaultLocale: 'en',
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link
          href={{
            pathname: '/en/community/[communityId]/[communitySlug]/statistics',
            query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
          }}
        >
          Link
        </Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/en/community/[communityId]/[communitySlug]/statistics?communityId=300&communitySlug=three-hundred&baz=3',
      '/en/root/community/300-three-hundred/statistics?baz=3',
      { locale: 'en', scroll: undefined, shallow: undefined },
    )
  })

  test('with locale', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr'],
          defaultLocale: 'en',
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link
          href={{
            pathname: '/en/community/[communityId]/[communitySlug]/statistics',
            query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
          }}
          locale="fr"
        >
          Link
        </Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/en/community/[communityId]/[communitySlug]/statistics?communityId=300&communitySlug=three-hundred&baz=3',
      '/communaute/300-three-hundred/statistiques?baz=3',
      { locale: 'fr', scroll: undefined, shallow: undefined },
    )
  })
})
