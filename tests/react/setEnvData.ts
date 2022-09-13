import { TNtrData } from '../../src/types'
import routesTree from '../fixtures/routesTree.json'

const defaultNtrData = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es', 'pt'],
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
