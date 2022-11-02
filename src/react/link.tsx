import NextLink, { LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import React from 'react'

import { translatePushReplaceArgs } from './translatePushReplaceArgs'

/**
 * Link component that handle route translations
 */
export const Link: React.FC<React.PropsWithChildren<LinkProps>> = ({ href, as, locale, ...props }) => {
  const router = useNextRouter()
  const translatedArgs = translatePushReplaceArgs({ router, url: href, as, locale })

  return <NextLink href={translatedArgs.url} as={translatedArgs.as} locale={translatedArgs.locale} {...props} />
}

export default Link
