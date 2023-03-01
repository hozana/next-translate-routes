import { NextRouter, SingletonRouter } from 'next/router'
import type { UrlObject } from 'url'

import type { Url } from '../types'
import { fileUrlToFileUrlObject } from './fileUrlToFileUrlObject'
import { fileUrlToUrl } from './fileUrlToUrl'
import { getLocale } from './getLocale'
import { removeLangPrefix } from './removeLangPrefix'
import { urlToFileUrl } from './urlToFileUrl'

export const translatePushReplaceArgs = ({
  router,
  url,
  as,
  locale,
}: {
  router: NextRouter | SingletonRouter
  url: Url
  as?: Url
  locale?: string | false
}) => {
  if (as) {
    return { url, as, locale }
  }

  const newLocale = getLocale({ router, locale, url })
  const unprefixedUrl = typeof url === 'string' ? removeLangPrefix(url) : url
  const urlLocale = typeof url === 'string' && unprefixedUrl !== url ? url.split('/')[1] : undefined

  /**
   * url can be:
   * - an external url
   * - a correct file url
   * - a wrong file url (not matching any page)
   * - a correct translated url
   * - a wrong translated url
   */

  try {
    /**
     * We need the parsedUrl to be in Next UrlObject synthax, otherwise there is conflicts with the as prop
     * See: https://github.com/hozana/next-translate-routes/issues/54
     */
    let parsedUrl: UrlObject | URL | string | undefined
    let translatedUrl = fileUrlToUrl(unprefixedUrl, newLocale, { throwOnError: false })

    if (translatedUrl) {
      // url is a correct file url
      parsedUrl = fileUrlToFileUrlObject(unprefixedUrl)
    } else {
      // url is not a correct file url
      parsedUrl = urlToFileUrl(unprefixedUrl, urlLocale || newLocale)
      if (parsedUrl) {
        translatedUrl = fileUrlToUrl(parsedUrl, newLocale)
        // If fileUrlToUrl did not throw, url is a correct translated url
      }
    }

    return { url: parsedUrl || url, as: translatedUrl, locale: newLocale }
  } catch (error) {
    // url seems to be either a wrong file url or an external url:
    // do not bring changes if no translation is found
    return { url, locale }
  }
}
