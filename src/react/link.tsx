import NextLink, { type LinkProps } from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import React from 'react'

import { translatePushReplaceArgs } from './translatePushReplaceArgs'

/**
 * Link component that handle route translations
 */
export const Link: typeof NextLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, as, locale, ...props }, ref) => {
    const router = useNextRouter()
    const translatedArgs = translatePushReplaceArgs({ router, url: href, as, locale })

    return (
      <NextLink ref={ref} href={translatedArgs.url} as={translatedArgs.as} locale={translatedArgs.locale} {...props} />
    )
  },
)

export default Link
