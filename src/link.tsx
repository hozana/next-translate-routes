import React from 'react'
import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import { removeLangPrefix, translateUrl } from './translateUrl'

/**
 * Link component that handle route translations
 */
export const Link: React.FC<LinkProps> = ({ href, as, locale: propLocale, ...props }) => {
  const { locale: routerLocale, defaultLocale, locales } = useNextRouter()
  let locale = propLocale || routerLocale || defaultLocale || locales?.[0]
  const unPrefixedHref = typeof href === 'string' ? removeLangPrefix(href) : href

  if (!propLocale && typeof href === 'string' && unPrefixedHref !== href) {
    const hrefLocale = unPrefixedHref !== href ? (href as string).split('/')[1] : null
    if (hrefLocale && (!locales || locales.includes(hrefLocale))) {
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
