import { getLocalePathFromPaths } from '../plugin/getPathFromPaths'
import { getNtrData } from './ntrData'

export function removeLangPrefix(pathname: string, toArray?: false, locale?: string): string
export function removeLangPrefix(pathname: string, toArray: true, locale?: string): string[]
export function removeLangPrefix(pathname: string, toArray?: boolean, givenLocale?: string): string | string[] {
  const pathParts = pathname.split('/').filter(Boolean)
  const { routesTree, defaultLocale, locales } = getNtrData()

  const getLangRoot = (lang: string) => getLocalePathFromPaths({ paths: routesTree.paths, locale: lang })

  const defaultLocaleRoot = defaultLocale && getLangRoot(defaultLocale)
  const hasLangPrefix = givenLocale ? pathParts[0] === givenLocale : locales.includes(pathParts[0])
  const hasDefaultLocalePrefix = !hasLangPrefix && !!defaultLocaleRoot && pathParts[0] === defaultLocaleRoot
  const hasGivenLocalePrefix = givenLocale ? pathParts[hasLangPrefix ? 1 : 0] === getLangRoot(givenLocale) : false

  if (!hasLangPrefix && !hasDefaultLocalePrefix && !hasGivenLocalePrefix) {
    return toArray ? pathParts : pathname
  }

  const locale = givenLocale || hasLangPrefix ? pathParts[0] : defaultLocale
  const localeRootParts = (locale || hasGivenLocalePrefix) && getLangRoot(locale)?.split('/')
  const nbPathPartsToRemove =
    (hasLangPrefix ? 1 : 0) +
    (localeRootParts && (!hasLangPrefix || pathParts[1] === localeRootParts[0]) ? localeRootParts.length : 0)

  return toArray ? pathParts.slice(nbPathPartsToRemove) : `/${pathParts.slice(nbPathPartsToRemove).join('/')}`
}
