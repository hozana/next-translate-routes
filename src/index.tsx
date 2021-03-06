import React, { ComponentType, useMemo } from 'react'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context'

import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'
import { getNtrData } from './getNtrData'
import { translateUrl } from './translateUrl'
import type { TNtrData, Url } from './types'
import { Link } from './link'
import { AppContextType, AppInitialProps } from 'next/dist/shared/lib/utils'
import type { NextComponentType } from 'next'

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

      if (debug) {
        console.log('[next-translate-routes] - router.prefetch.', { inputUrl, asPath, options, as, locale })
      }

      return prefetch(inputUrl, as, options)
    },
    locale,
    ...otherRouterProps,
  }
}

/**
 * Get router with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next useRouter (`next/router`)
 */
export const useRouter = (): NextRouter => {
  const nextRouter = useNextRouter()
  return enhanceNextRouter(nextRouter)
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Inject router prop with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next withRouter (`next/router`)
 */
export const withRouter = <P extends Record<string, any>>(Component: ComponentType<{ router: NextRouter } & P>) =>
  Object.assign((props: P) => <Component router={useNextRouter()} {...props} />, {
    displayName: `withRouter(${Component.displayName})`,
  })

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

  if (typeof window === 'undefined') {
    global.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  } else {
    window.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  }

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
