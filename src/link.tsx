import React from 'react'
import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import { translateUrl } from './translateUrl'

/**
 * Link component that handle route translations
 */
export const Link: React.FC<LinkProps> = ({ href, as, locale, ...props }) => {
  const { locale: routerLocale } = useNextRouter()
  const language = locale || (routerLocale as string)
  return <NextLink href={translateUrl(as || href, language, { format: 'string' })} locale={false} {...props} />
}

export default Link
