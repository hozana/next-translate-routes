import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'
import { NextRouter, SingletonRouter } from 'next/router'

import { getNtrData } from '../shared/ntrData'
import type { Url } from '../types'
import { translateUrl } from './translateUrl'

interface Options {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const enhancePushReplace =
  <R extends NextRouter | SingletonRouter>(router: R, fnName: 'push' | 'replace') =>
  (url: Url, as?: Url, options?: Options) => {
    const { debug } = getNtrData()
    const { locale } = router
    const translatedUrl =
      as ||
      (options?.locale || locale ? translateUrl(url, options?.locale || (locale as string), { format: 'object' }) : url)

    if (debug) {
      console.log(`[next-translate-routes] - router.${fnName}.`, { url, as, options, translatedUrl, locale })
    }

    return router[fnName](translatedUrl, as, options)
  }

const enhancePrefetch =
  <R extends NextRouter | SingletonRouter>({ locale, prefetch }: R) =>
  (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
    const { debug } = getNtrData()
    const as =
      asPath ||
      (options?.locale || locale
        ? (translateUrl(inputUrl, options?.locale || (locale as string), { format: 'string' }) as string)
        : inputUrl)

    if (debug === 'withPrefetch') {
      console.log('[next-translate-routes] - router.prefetch.', { inputUrl, asPath, options, as, locale })
    }

    return prefetch(inputUrl, as, options)
  }

export const enhanceNextRouter = <R extends NextRouter | SingletonRouter>(router: R) => {
  if ('router' in router) {
    return new Proxy(router, {
      get(target, p) {
        if (p === 'push' || p === 'replace') {
          return enhancePushReplace(target, p)
        }
        if (p === 'prefetch') {
          return enhancePrefetch(target)
        }
        return target[p as keyof R]
      },
    })
  }

  return {
    ...router,
    push: enhancePushReplace(router, 'push'),
    replace: enhancePushReplace(router, 'replace'),
    prefetch: enhancePrefetch(router),
  } as R
}
