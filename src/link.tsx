import React from 'react'
import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import { getDefaultLocale, getLocales } from './getEnv'
import { removeLangPrefix, translateUrl } from './translateUrl'

/**
 * Link component that handle route translations
 */
export const Link: React.FC<LinkProps> = ({ href, as, locale: propLocale, ...props }) => {
  const { locale: routerLocale } = useNextRouter()
  let locale = propLocale || routerLocale || getDefaultLocale() || getLocales()[0]
  const unPrefixedHref = typeof href === 'string' ? removeLangPrefix(href) : href

  if (!propLocale && typeof href === 'string' && unPrefixedHref !== href) {
    const hrefLocale = unPrefixedHref !== href ? (href as string).split('/')[1] : null
    if (hrefLocale && getLocales().includes(hrefLocale)) {
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
