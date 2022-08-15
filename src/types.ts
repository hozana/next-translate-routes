import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes'
import type { I18NConfig, NextConfig, NextConfigComplete } from 'next/dist/server/config-shared'
import type { UrlObject } from 'url'

export type Url = UrlObject | string
type TAnyLocale = Exclude<string, 'default'>
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

export type TNtrData = {
  debug?: boolean | 'withPrefetch'
  defaultLocale: string
  locales: string[]
  routesTree: TRouteBranch
}

export type NTRConfig = {
  debug?: boolean
  routesDataFileName?: string
  routesTree?: TRouteBranch
  pagesDirectory?: string
}

export type NextConfigWithNTR = NextConfig & { i18n: I18NConfig; translateRoutes?: NTRConfig }
export type NextConfigCompleteWithNTR = NextConfigComplete & { i18n: I18NConfig; translateRoutes: NTRConfig }

declare global {
  // eslint-disable-next-line no-var
  var __NEXT_TRANSLATE_ROUTES_DATA: TNtrData

  interface Window {
    __NEXT_TRANSLATE_ROUTES_DATA: TNtrData
  }
}
