import type { TNtrData } from '../types'

export const setNtrData = (ntrData: TNtrData) => {
  if (typeof window === 'undefined') {
    global.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  } else {
    window.__NEXT_TRANSLATE_ROUTES_DATA = ntrData
  }
}

export const getNtrData = () =>
  typeof window === 'undefined' ? global.__NEXT_TRANSLATE_ROUTES_DATA : window.__NEXT_TRANSLATE_ROUTES_DATA
