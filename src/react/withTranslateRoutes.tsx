import type { NextComponentType } from 'next'
import { AppContextType, AppInitialProps } from 'next/dist/shared/lib/utils'
import { NextRouter, useRouter as useNextRouter } from 'next/router'
import React, { useMemo } from 'react'

import { setNtrData } from '../shared/ntrData'
import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { TNtrData } from '../types'
import { enhanceNextRouter } from './enhanceNextRouter'

// TODO: Remove dynamic import for RouterContext to remove backwards compability
let RouterContext: React.Context<NextRouter | null>
try {
  RouterContext = require('next/dist/shared/lib/router-context.shared-runtime').RouterContext
} catch (e) {
  RouterContext = require('next/dist/shared/lib/router-context').RouterContext
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
    throw new Error(ntrMessagePrefix + 'No wrapped App component in withTranslateRoutes')
  }

  if (!ntrData) {
    throw new Error(
      ntrMessagePrefix +
        'No translate routes data found. next-translate-routes plugin is probably missing from next.config.js',
    )
  }

  setNtrData(ntrData)

  if (ntrData.debug && typeof window !== 'undefined') {
    console.log(ntrMessagePrefix + 'withTranslateRoutes. NTR data:', ntrData)
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
      console.error(ntrMessagePrefix + `No locale prop in Router: fallback to ${fallbackLocale}.`)
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
