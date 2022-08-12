import type { NextComponentType } from 'next'
import { RouterContext } from 'next/dist/shared/lib/router-context'
import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'
import { AppContextType, AppInitialProps } from 'next/dist/shared/lib/utils'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import React, { useMemo } from 'react'

import { getNtrData, setNtrData } from '../shared/ntrData'
import type { TNtrData, Url } from '../types'
import { Link } from './link'
import { translateUrl } from './translateUrl'

interface TransitionOptions {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const enhanceNextRouter = ({ push, replace, prefetch, locale, ...otherRouterProps }: NextRouter): NextRouter => {
  const { debug } = getNtrData()

  return {
    push: (url: Url, as?: Url, options?: TransitionOptions) => {
      const translatedUrl =
        as ||
        (options?.locale || locale
          ? translateUrl(url, options?.locale || (locale as string), { format: 'object' })
          : url)

      if (debug) {
        console.log('[next-translate-routes] - router.push.', { url, as, options, translatedUrl, locale })
      }

      return push(translatedUrl, as, options)
    },
    replace: (url: Url, as?: Url, options?: TransitionOptions) => {
      const translatedUrl =
        as ||
        (options?.locale || locale
          ? translateUrl(url, options?.locale || (locale as string), { format: 'object' })
          : url)

      if (debug) {
        console.log('[next-translate-routes] - router.replace.', { url, as, options, translatedUrl, locale })
      }

      return replace(translatedUrl, as, options)
    },
    prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
      const as =
        asPath ||
        (options?.locale || locale
          ? (translateUrl(inputUrl, options?.locale || (locale as string), { format: 'string' }) as string)
          : inputUrl)

      if (debug === 'withPrefetch') {
        console.log('[next-translate-routes] - router.prefetch.', { inputUrl, asPath, options, as, locale })
      }

      return prefetch(inputUrl, as, options)
    },
    locale,
    ...otherRouterProps,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TWrappedAppComponent = NextComponentType<AppContextType<NextRouter>, AppInitialProps, any>

/**
 * Must wrap the App component in `pages/_app`.
 * This HOC will make the route push, replace, and refetch functions able to translate routes.
 */
export const withTranslateRoutes = (...args: (TWrappedAppComponent | TNtrData)[]) => {
  // ntrData argument is added as a argument by webpack next-translate-routes/loader, and can also be added manually
  const { ntrData, AppComponent } = args.reduce((acc, arg) => {
    if (typeof arg === 'function') {
      return {
        ...acc,
        AppComponent: arg,
      }
    }
    return {
      ...acc,
      ntrData: {
        ...acc.ntrData,
        ...arg,
      },
    }
  }, {} as { ntrData: TNtrData; AppComponent: TWrappedAppComponent })

  if (!AppComponent) {
    throw new Error('[next-translate-routes] - No wrapped App component in withTranslateRoutes')
  }

  if (!ntrData) {
    throw new Error(
      '[next-translate-routes] - No translate routes data found. next-translate-routes plugin is probably missing from next.config.js',
    )
  }

  setNtrData(ntrData)

  if (ntrData.debug && typeof window !== 'undefined') {
    console.log('[next-translate-routes] - withTranslateRoutes. NTR data:', ntrData)
  }

  const WithTranslateRoutesApp: TWrappedAppComponent = (props) => {
    const nextRouter = useNextRouter()

    const enhancedRouter = useMemo(
      () => (nextRouter ? enhanceNextRouter(nextRouter) : props.router),
      [nextRouter, props.router],
    )

    if (nextRouter && !nextRouter.locale) {
      const fallbackLocale = ntrData.defaultLocale || ntrData.locales[0]
      nextRouter.locale = fallbackLocale
      console.error(`[next-translate-routes] - No locale prop in Router: fallback to ${fallbackLocale}.`)
    }

    return (
      <RouterContext.Provider value={enhancedRouter}>
        <AppComponent {...props} />
      </RouterContext.Provider>
    )
  }

  WithTranslateRoutesApp.getInitialProps = 'getInitialProps' in AppComponent ? AppComponent.getInitialProps : undefined

  return WithTranslateRoutesApp
}

export default withTranslateRoutes
export { Link, translateUrl }
