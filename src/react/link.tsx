import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import React from 'react'
import { getLocale } from './getLocale'

import { getNtrData } from './ntrData'
import { removeLangPrefix, translateUrl } from './translateUrl'

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

  return (
    <NextLink
      href={unPrefixedHref}
      as={as || translateUrl(href, locale, { format: 'string' })}
      locale={locale}
      {...props}
    />
  )
}

export default Link
