/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { RouterContext } from 'next/dist/shared/lib/router-context'
import React from 'react'

import { Link } from '../../src/link'
import { setEnvData, setEnvDataFallbackLng } from './setEnvData'

describe('Link', () => {
  const push = jest.fn(() => Promise.resolve(true))
  beforeEach(() => {
    setEnvData()
    push.mockClear()
  })

  test('unprefixed url, no locale', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
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
            pathname: '/community/[communityId]/[communitySlug]/statistics',
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
      '/community/[communityId]/[communitySlug]/statistics?communityId=300&communitySlug=three-hundred&baz=3',
      '/en/root/community/300-three-hundred/statistics?baz=3',
      { locale: 'en', scroll: undefined, shallow: undefined },
    )
  })

  test('unprefixed url, locale changed', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
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
            pathname: '/community/[communityId]/[communitySlug]/statistics',
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
      '/community/[communityId]/[communitySlug]/statistics?communityId=300&communitySlug=three-hundred&baz=3',
      '/communaute/300-three-hundred/statistiques?baz=3',
      { locale: 'fr', scroll: undefined, shallow: undefined },
    )
  })

  test('prefixed url, no locale', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr'],
          defaultLocale: 'en',
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link href="/fr/communaute/300-three-hundred/statistiques?baz=3">Link</Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/community/[communityId]/[communitySlug]/statistics?baz=3&communityId=300&communitySlug=three-hundred',
      '/en/root/community/300-three-hundred/statistics?baz=3',
      { locale: 'en', scroll: undefined, shallow: undefined },
    )
  })

  test('prefixed url, locale to false', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr'],
          defaultLocale: 'en',
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link href="/fr/communaute/300-three-hundred/statistiques?baz=3" locale={false}>
          Link
        </Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/community/[communityId]/[communitySlug]/statistics?baz=3&communityId=300&communitySlug=three-hundred',
      '/communaute/300-three-hundred/statistiques?baz=3',
      { locale: 'fr', scroll: undefined, shallow: undefined },
    )
  })
})

describe('LinkFallBackLng', () => {
  const push = jest.fn(() => Promise.resolve(true))
  beforeEach(() => {
    setEnvDataFallbackLng()
    push.mockClear()
  })

  test('unprefixed url, locale changed', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr', 'fr-FR'],
          defaultLocale: 'en',
          fallbackLng: {
            fr: ['fr-FR'],
          },
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link
          href={{
            pathname: '/community/[communityId]/[communitySlug]/statistics',
            query: { communityId: 300, communitySlug: 'three-hundred', baz: 3 },
          }}
          locale="fr-FR"
        >
          Link
        </Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/community/[communityId]/[communitySlug]/statistics?communityId=300&communitySlug=three-hundred&baz=3',
      '/communaute/300-three-hundred/statistiques?baz=3',
      { locale: 'fr-FR', scroll: undefined, shallow: undefined },
    )
  })

  test('prefixed url, no locale', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr', 'fr-FR'],
          defaultLocale: 'en',
          fallbackLng: {
            fr: ['fr-FR'],
          },
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link href="/fr-FR/communaute/300-three-hundred/statistiques?baz=3">Link</Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/community/[communityId]/[communitySlug]/statistics?baz=3&communityId=300&communitySlug=three-hundred',
      '/en/root/community/300-three-hundred/statistics?baz=3',
      { locale: 'en', scroll: undefined, shallow: undefined },
    )
  })

  test('prefixed url, locale to false', () => {
    const { container } = render(
      <RouterContext.Provider
        value={{
          beforePopState: true, // If the router is an NextRouter instance it will have `beforePopState`
          isLocaleDomain: true,
          locale: 'en',
          locales: ['en', 'fr', 'fr-FR'],
          defaultLocale: 'en',
          fallbackLng: {
            fr: ['fr-FR'],
          },
          push,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({} as any),
        }}
      >
        <Link href="/fr-FR/communaute/300-three-hundred/statistiques?baz=3" locale={false}>
          Link
        </Link>
      </RouterContext.Provider>,
    )

    expect(push).not.toHaveBeenCalled()
    container.querySelector('a')?.click()
    expect(push).toHaveBeenCalledWith(
      '/community/[communityId]/[communitySlug]/statistics?baz=3&communityId=300&communitySlug=three-hundred',
      '/communaute/300-three-hundred/statistiques?baz=3',
      { locale: 'fr-FR', scroll: undefined, shallow: undefined },
    )
  })
})
