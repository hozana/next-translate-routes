import { useRouter as useNextRouter, withRouter as withNextRouter } from 'next/router'

/**
 * Get router with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next useRouter (`next/router`)
 */
export declare const useRouter: typeof useNextRouter
/**
 * Inject router prop with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next withRouter (`next/router`)
 */
export declare const withRouter: typeof withNextRouter
