import React, { ComponentProps, ComponentType } from 'react'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context'

import type { AppProps, PrefetchOptions } from 'next/dist/shared/lib/router/router'
import { getDefaultLocale, getLocales, getRoutesTree } from './getEnv'
import { translateUrl } from './translateUrl'
import type { Url } from './types'
import { Link } from './link'

interface TransitionOptions {
  shallow?: boolean
  locale?: string | false
  scroll?: boolean
}

const enhanceNextRouter = ({ push, replace, prefetch, locale, ...otherRouterProps }: NextRouter): NextRouter => ({
  push: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedPath =
      as ||
      (options?.locale || locale ? translateUrl(url, options?.locale || (locale as string), { format: 'object' }) : url)
    return push(translatedPath, as, options)
  },
  replace: (url: Url, as?: Url, options?: TransitionOptions) => {
    const translatedPath =
      as ||
      (options?.locale || locale ? translateUrl(url, options?.locale || (locale as string), { format: 'object' }) : url)
    return replace(translatedPath, as, options)
  },
  prefetch: (inputUrl: string, asPath?: string, options?: PrefetchOptions) => {
    const as =
      asPath ||
      (options?.locale || locale
        ? (translateUrl(inputUrl, options?.locale || (locale as string), { format: 'string' }) as string)
        : inputUrl)
    return prefetch(inputUrl, as, options)
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
export const withTranslateRoutes = <A extends ComponentType<AppProps>>(AppComponent: A) => {
  if (!getRoutesTree()) {
    throw new Error(
      '> next-translate-routes - No routes tree defined. next-translate-routes plugin is probably missing from next.config.js',
    )
  }

  const WithTranslateRoutesApp: React.FC<ComponentProps<A>> = (props: any) => {
    const nextRouter = useNextRouter()

    if (nextRouter && !nextRouter.locale) {
      const fallbackLocale = getDefaultLocale() || getLocales()[0]
      nextRouter.locale = fallbackLocale
      console.error(`> next-translate-routes - No locale prop in Router: fallback to ${fallbackLocale}.`)
    }

    return (
      <RouterContext.Provider value={nextRouter ? enhanceNextRouter(nextRouter) : props.router}>
        <AppComponent {...props} />
      </RouterContext.Provider>
    )
  }

  return WithTranslateRoutesApp
}

export default withTranslateRoutes
export { Link, translateUrl }
