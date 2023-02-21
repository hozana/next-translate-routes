import { parse as parseQuery } from 'querystring'
import { parse, UrlObject, UrlWithParsedQuery } from 'url'

/** Parse an url and its query to object */
export const parseUrl = (url: UrlObject | URL | string) =>
  typeof url === 'string' || url instanceof URL
    ? parse(url.toString(), true)
    : ({ ...url, query: typeof url.query === 'string' ? parseQuery(url.query) : url.query } as UrlWithParsedQuery)
