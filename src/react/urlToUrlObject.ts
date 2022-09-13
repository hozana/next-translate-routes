import { parse as parseQuery } from 'querystring'
import { parse, UrlObject } from 'url'

export const urlToUrlObject = (url: UrlObject | URL | string) => {
  const { pathname, query, hash } =
    typeof url === 'string' ? parse(url) : url instanceof URL ? parse(url.toString()) : url
  const parsedQuery = typeof query === 'string' ? parseQuery(query) : query || {}
  return { pathname, query: parsedQuery, hash }
}
