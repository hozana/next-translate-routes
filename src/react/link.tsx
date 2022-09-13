import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import React from 'react'
import type { UrlObject } from 'url'

import { fileUrlToUrl } from './fileUrlToUrl'
import { getLocale } from './getLocale'
import { getNtrData } from './ntrData'
import { removeLangPrefix } from './removeLangPrefix'
import { urlToFileUrl } from './urlToFileUrl'

/**
 * Link component that handle route translations
 */
export const Link: React.FC<React.PropsWithChildren<LinkProps>> = ({ href, as, locale: propLocale, ...props }) => {
  const router = useNextRouter()
  let locale = getLocale(router, propLocale)
  const locales = router.locales || getNtrData().locales
  const unPrefixedHref = typeof href === 'string' ? removeLangPrefix(href) : href

  if (!propLocale && typeof href === 'string' && unPrefixedHref !== href) {
    const hrefLocale = href.split('/')[1]
    if (hrefLocale && locales.includes(hrefLocale)) {
      locale = hrefLocale
    }
  }

  let translatedUrl: string | undefined
  let parsedUrl: UrlObject | URL | string | undefined

  /**
   * Href can be:
   * - an external url
   * - a correct file url
   * - a wrong file url (not matching any page)
   * - a correct translated url
   * - a wrong translated url
   */
  try {
    translatedUrl = fileUrlToUrl(unPrefixedHref, locale)
    // Href is a correct file url
    parsedUrl = unPrefixedHref
  } catch {
    parsedUrl = urlToFileUrl(unPrefixedHref, locale)
    if (parsedUrl) {
      try {
        translatedUrl = fileUrlToUrl(parsedUrl, locale)
        // Href is a correct translated url
      } catch {
        // Href is a wrong file url or an external url
      }
    } else {
      // Href is a wrong url or an external url
    }
  }

  return <NextLink href={parsedUrl || href} as={as || translatedUrl} locale={locale} {...props} />
}

export default Link
