import { I18NConfig } from 'next/dist/server/config-shared'

import { TNtrData } from '../../src/types'
import routesTree from '../fixtures/routesTree.json'

const defaultNtrData = {
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'es', 'pt'],
  },
  routesTree,
}

declare global {
  interface Window {
    __NEXT_TRANSLATE_ROUTES_DATA: import('../../src/types').TNtrData
  }
}

export const setEnvData = (ntrData: Omit<Partial<TNtrData>, 'i18n'> & { i18n?: Partial<I18NConfig> } = {}) => {
  window.__NEXT_TRANSLATE_ROUTES_DATA = {
    ...defaultNtrData,
    ...ntrData,
    i18n: {
      ...defaultNtrData.i18n,
      ...ntrData?.i18n,
    },
  }
}
