import { NextRouter, SingletonRouter } from 'next/router'

import { getNtrData } from './ntrData'

export const getLocale = (
  { locale, defaultLocale, locales }: NextRouter | SingletonRouter,
  explicitLocale?: string | false,
) => explicitLocale || locale || defaultLocale || locales?.[0] || getNtrData().defaultLocale || getNtrData().locales[0]
