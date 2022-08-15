import NextSingletonRouter, { useRouter as useNextRouter, withRouter as withNextRouter } from 'next/router'

import { enhanceNextRouter } from './enhanceNextRouter'

export const SingletonRouter = enhanceNextRouter(NextSingletonRouter)

/**
 * Get router with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next useRouter (`next/router`)
 */
export const useRouter = useNextRouter

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Inject router prop with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next withRouter (`next/router`)
 */
export const withRouter = withNextRouter
