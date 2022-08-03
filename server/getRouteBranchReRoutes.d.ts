import type { TReRoutes, TRouteBranch, TRouteSegment } from '../types'

/**
 * Get redirects and rewrites for a page
 */
export declare const getPageReRoutes: <L extends string>({
  locales,
  routeSegments,
  defaultLocale,
}: {
  locales: L[]
  routeSegments: TRouteSegment<L>[]
  defaultLocale?: L | undefined
}) => TReRoutes
/**
 * Generate reroutes in route branch to feed the rewrite section of next.config
 */
export declare const getRouteBranchReRoutes: <L extends string>({
  locales,
  routeBranch: { children, ...routeSegment },
  previousRouteSegments,
  defaultLocale,
}: {
  locales: L[]
  routeBranch: TRouteBranch<L>
  previousRouteSegments?: TRouteSegment<L>[] | undefined
  defaultLocale?: L | undefined
}) => TReRoutes
