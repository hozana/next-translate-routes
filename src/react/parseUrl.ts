import { ParsedUrl, parseUrl as nextParseUrl } from 'next/dist/shared/lib/router/utils/parse-url'
import { searchParamsToUrlQuery, urlQueryToSearchParams } from 'next/dist/shared/lib/router/utils/querystring'
import type { ParsedUrlQuery } from 'querystring'
import type { UrlObject } from 'url'

/** Parse an url and its query to object */
export const parseUrl = (url: UrlObject | URL | string): ParsedUrl =>
  typeof url === 'string'
    ? nextParseUrl(url)
    : {
        hash: url.hash || '',
        hostname: url.hostname,
        href: url.href || '',
        pathname: url.pathname || '/',
        port: url.port?.toString(),
        protocol: url.protocol,
        query: searchParamsToUrlQuery(
          url instanceof URL
            ? url.searchParams
            : typeof url.query === 'object' && url.query
            ? urlQueryToSearchParams(url.query as ParsedUrlQuery)
            : new URLSearchParams(url.query || undefined),
        ),
        search: url.search || '',
      }
