import { isDefaultLocale } from '../shared/isDefaultLocale'
import { getNtrData } from './ntrData'

/**
 * Remove both the lang prefix and the root prefix from a pathname
 *
 * (The root prefix is a prefix that can be added for a locale between the locale prefix
 * and the rest of the pathname. It is defined in the root _routes.json file for the "/" key.)
 */
export function removeLangPrefix(
  pathname: string,
  /**
   * If locale is explicitely given, removeLangPrefix will use it,
   * it it is not, removeLangPrefix will try to deduce the locale from the pathname
   */
  locale?: string,
): string {
  const {
    routesTree,
    i18n,
    i18n: { locales },
  } = getNtrData()
  let lang = locale
  let root = ''

  const getLangRoot = (lang: string) => routesTree.paths[lang] || routesTree.paths.default

  if (locale) {
    root = getLangRoot(locale)
  } else {
    const prefixLocale = locales.find((locale) => new RegExp(`\\/${locale}(\\/|$)`).test(pathname))
    if (prefixLocale) {
      lang = prefixLocale
      root = getLangRoot(prefixLocale)
    } else {
      for (const l of locales) {
        if (isDefaultLocale(l, i18n)) {
          lang = l
          root = getLangRoot(l)
          break
        }
      }
    }
  }

  let remainingPathname: string | undefined = undefined

  if (!lang) {
    return pathname
  }

  const fullPrefix = `/${lang}/${root}`

  if (root && pathname.startsWith(fullPrefix)) {
    remainingPathname = pathname.slice(fullPrefix.length)
  } else if (root && pathname.startsWith(`/${root}`)) {
    remainingPathname = pathname.slice(root.length + 1)
  } else if (pathname.startsWith(`/${lang}`)) {
    remainingPathname = pathname.slice(lang.length + 1)
  }

  if (typeof remainingPathname === 'string' && /^($|\/)/.test(remainingPathname)) {
    return remainingPathname
  }

  return pathname
}
