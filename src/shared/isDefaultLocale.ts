import type { I18NConfig } from 'next/dist/server/config-shared'

export const isDefaultLocale = (locale: string, i18nConfig: I18NConfig) =>
  i18nConfig.defaultLocale === locale || !!i18nConfig.domains?.some((domain) => domain.defaultLocale === locale)
