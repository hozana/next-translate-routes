import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { I18NConfig, NextConfig, NextConfigComplete } from 'next/dist/server/config-shared'
import type { UrlObject } from 'url'

export type Url = UrlObject | string
export type TAnyLocale = Exclude<string, 'default'>
export type TReRoutes = { redirects: Redirect[]; rewrites: Rewrite[] }
export type TRouteSegmentPaths<L extends TAnyLocale> = { default: string } & Partial<Record<L, string>>
export type TRouteSegmentData<L extends TAnyLocale> = string | ({ default?: string } & Partial<Record<L, string>>)
export type TRouteSegmentsData<L extends TAnyLocale> = Record<string, TRouteSegmentData<L>>
export type TRouteSegment<L extends TAnyLocale> = {
  name: string
  paths: TRouteSegmentPaths<L>
}
export type TRouteBranch<L extends TAnyLocale = string> = TRouteSegment<L> & {
  children?: TRouteBranch<L>[]
}
export type TFallbackLng = string | string[] | { [key: string]: string[] }

export type TNtrData<L extends TAnyLocale = string> = {
  debug?: boolean | 'withPrefetch'
  defaultLocale: L
  locales: L[]
  routesTree: TRouteBranch<L>
  fallbackLng?: TFallbackLng | undefined
}

export type NTRConfig = {
  debug?: boolean
  routesDataFileName?: string
  routesTree?: TRouteBranch
  pagesDirectory?: string
}

export type NTRI18NConfig = {
  fallbackLng?: TFallbackLng
} & I18NConfig

export type NTRNextConfig = {
  i18n: NTRI18NConfig
} & NextConfig

export type NextConfigWithNTR = NextConfig & {
  i18n: NTRI18NConfig
  translateRoutes?: NTRConfig
}
export type NextConfigCompleteWithNTR = NextConfigComplete & { i18n: NTRI18NConfig; translateRoutes: NTRConfig }

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
