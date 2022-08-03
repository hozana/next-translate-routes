import type { NextComponentType } from 'next'
import { AppContextType, AppInitialProps } from 'next/dist/shared/lib/utils'
import { NextRouter } from 'next/router'
import React from 'react'

import type { TNtrData } from '../types'
import { Link } from './link'
import { translateUrl } from './translateUrl'

declare type TWrappedAppComponent = NextComponentType<AppContextType<NextRouter>, AppInitialProps, any>
/**
 * Must wrap the App component in `pages/_app`.
 * This HOC will make the route push, replace, and refetch functions able to translate routes.
 */
export declare const withTranslateRoutes: (
  ...args: (TWrappedAppComponent | TNtrData)[]
) => React.FunctionComponent<any> & {
  getInitialProps?(context: AppContextType<NextRouter>): AppInitialProps | Promise<AppInitialProps>
}
export default withTranslateRoutes
export { Link, translateUrl }
