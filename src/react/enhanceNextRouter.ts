import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'
import { NextRouter, SingletonRouter } from 'next/router'
import { stringify as stringifyQuery } from 'querystring'

import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { Url } from '../types'
import { getLocale } from './getLocale'
import { getNtrData } from './ntrData'
import { translatePushReplaceArgs } from './translatePushReplaceArgs'
import { urlToFileUrl } from './urlToFileUrl'

interface Options {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const logWithTrace = (from: string, details: unknown) => {
  console.groupCollapsed(ntrMessagePrefix + from, details)
  console.trace('Stringified:\n', JSON.stringify(details, null, 4))
  console.groupEnd()
}

const enhancePushReplace =
  <R extends NextRouter | SingletonRouter>(router: R, fnName: 'push' | 'replace') =>
  (url: Url, as?: Url, options?: Options) => {
    const translatedArgs = translatePushReplaceArgs({ router, url, as, locale: options?.locale })

    if (getNtrData().debug) {
      logWithTrace(`router.${fnName}`, {
        original: {
          url,
          as,
          options,
        },
        translated: translatedArgs,
      })
    }

    return router[fnName](translatedArgs.url, translatedArgs.as, { ...options, locale: translatedArgs.locale })
  }

const enhancePrefetch =
  <R extends NextRouter | SingletonRouter>(router: R) =>
  (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
    const locale = getLocale(router, options?.locale)
    const parsedInputUrl = urlToFileUrl(inputUrl, locale)

    if (getNtrData().debug === 'withPrefetch') {
      logWithTrace('router.prefetch', { inputUrl, asPath, options, parsedInputUrl, locale })
    }

    return router.prefetch(
      parsedInputUrl
        ? (parsedInputUrl.pathname || '/') +
            (parsedInputUrl.query &&
              `?${
                typeof parsedInputUrl.query === 'string' ? parsedInputUrl.query : stringifyQuery(parsedInputUrl.query)
              }`)
        : inputUrl,
      asPath,
      options,
    )
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
