/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { RouterContext } from 'next/dist/shared/lib/router-context'
import React from 'react'

import { Link } from '../../src/link'
import { setEnvData } from './setEnvData'

describe('Link', () => {
  const push = jest.fn(() => Promise.resolve(true))
  beforeEach(() => {
    setEnvData()
    push.mockClear()
  })

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
      '/root/community/300-three-hundred/statistics?baz=3',
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
        <Link href="/fr/communaute/300-three-hundred/statistiques?baz=3">Link</Link>
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
