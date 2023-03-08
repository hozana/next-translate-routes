import { TNtrData } from '../../src/types'
import routesTree from '../fixtures/routesTree.json'

const defaultNtrData = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es', 'pt'],
  routesTree,
}

const defaultNtrDataFallbackLng = {
  defaultLocale: 'fr-FR',
  locales: ['fr', 'fr-FR', 'fr-BE', 'en', 'es', 'pt'],
  fallbackLng: {
    'fr-FR': ['fr'],
    'fr-BE': ['fr'],
  },
  routesTree,
}

declare global {
  interface Window {
    __NEXT_TRANSLATE_ROUTES_DATA: import('../../src/types').TNtrData
  }
}

export const setEnvData = (ntrData: Partial<TNtrData> = {}) => {
  window.__NEXT_TRANSLATE_ROUTES_DATA = {
    ...defaultNtrData,
    ...ntrData,
  }
}

export const setEnvDataFallbackLng = (ntrData: Partial<TNtrData> = {}) => {
  window.__NEXT_TRANSLATE_ROUTES_DATA = {
    ...defaultNtrDataFallbackLng,
    ...ntrData,
  }
}
