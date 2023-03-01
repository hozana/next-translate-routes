import { NextRouter, SingletonRouter } from 'next/router'
import { UrlObject, parse as parseUrl } from 'url'

import { getNtrData } from './ntrData'

export const getLocale = ({
  router,
  locale: explicitLocale,
  url,
}: {
  router?: NextRouter | SingletonRouter
  locale?: string | false
  url?: string | UrlObject | URL
} = {}) => {
  if (explicitLocale) {
    return explicitLocale
  }
  const { i18n } = getNtrData()

  // explicitLocale === false if opted-out of automatically handling the locale prefixing
  // Cf. https://nextjs.org/docs/advanced-features/i18n-routing#transition-between-locales
  if (explicitLocale === false && url) {
    const { pathname } = typeof url === 'string' ? parseUrl(url) : url
    const localeSegment = pathname?.split('/')[1]
    if (localeSegment && i18n.locales.includes(localeSegment)) {
      return localeSegment
    }
  }
  return router?.locale || router?.defaultLocale || i18n.defaultLocale || router?.locales?.[0] || i18n.locales[0]
}
