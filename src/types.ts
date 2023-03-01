import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { I18NConfig, NextConfig } from 'next/dist/server/config-shared'
import type { UrlObject } from 'url'

export type Url = UrlObject | string
export type TReRoutes = { redirects: Redirect[]; rewrites: Rewrite[] }
export type TRouteSegmentPaths = { default: string } & Partial<Record<string, string>>
export type TRouteSegmentData = string | ({ default?: string } & Partial<Record<string, string>>)
export type TRouteSegmentsData = Record<string, TRouteSegmentData>
export type TRouteSegment = {
  name: string
  paths: TRouteSegmentPaths
}
export type TRouteBranch = TRouteSegment & {
  children?: TRouteBranch[]
}

export type TNtrData = {
  debug?: boolean | 'withPrefetch'
  i18n: I18NConfig
  routesTree: TRouteBranch
}

export type NTRConfig = {
  debug?: boolean
  routesDataFileName?: string
  routesTree?: TRouteBranch
  pagesDirectory?: string
}

export type NextConfigWithNTR = NextConfig & { i18n: I18NConfig; translateRoutes?: NTRConfig }

declare global {
  // eslint-disable-next-line no-var
  var __NEXT_TRANSLATE_ROUTES_DATA: TNtrData

  interface Window {
    __NEXT_TRANSLATE_ROUTES_DATA: TNtrData
  }

  interface ErrorConstructor {
    new (message?: string, options?: { cause: unknown | string | Error }): Error
  }
}
