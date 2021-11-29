import React, { ComponentType } from 'react'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context'

import { translateUrl } from './translateUrl'
import { Link } from './link'
import { getDefaultLocale, getLocales, getRoutesTree } from './getEnv'

import type { PrefetchOptions } from 'next/dist/shared/lib/router/router'
import type { UrlObject } from 'url'

type Url = UrlObject | string

interface TransitionOptions {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const enhanceNextRouter = ({ push, replace, prefetch, locale, ...otherRouterProps }: NextRouter): NextRouter => ({
  push: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedPath =
      options?.locale || locale
        ? translateUrl(as || url, options?.locale || (locale as string), { format: 'object' })
        : url
    return push(translatedPath, as || translatedPath, options)
  },
  replace: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedPath =
      options?.locale || locale
        ? translateUrl(as || url, options?.locale || (locale as string), { format: 'object' })
        : url
    return replace(translatedPath, as || translatedPath, options)
  },
  prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
    const translatedPath =
      options?.locale || locale
        ? (translateUrl(asPath || inputUrl, options?.locale || (locale as string), { format: 'string' }) as string)
        : inputUrl
    return prefetch(inputUrl, asPath || translatedPath, options)
  },
  locale,
  ...otherRouterProps,
})

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

/**
 * Must wrap the App component in `pages/_app`.
 * This HOC will make the route push, replace, and refetch functions able to translate routes.
 */
export const withTranslateRoutes = <A extends ComponentType<any>>(AppComponent: A) =>
  Object.assign(
    (props: any) => {
      if (!getRoutesTree()) {
        throw new Error(
          '> next-translate-routes - No routes tree defined. next-translate-routes plugin is probably missing from next.config.js',
        )
      }

      const nextRouter = useNextRouter()

      if (nextRouter && !nextRouter.locale) {
        const fallbackLocale = getDefaultLocale() || getLocales()[0]
        nextRouter.locale = fallbackLocale
        console.error(`> next-translate-routes - No locale prop in Router: fallback to ${fallbackLocale}.`)
      }

      return (
        <RouterContext.Provider value={nextRouter && enhanceNextRouter(nextRouter)}>
          <AppComponent {...props} />
        </RouterContext.Provider>
      )
    },
    { displayName: `withTranslateRoutes(${AppComponent.displayName})` },
  )

export { Link, translateUrl }
export default withTranslateRoutes
