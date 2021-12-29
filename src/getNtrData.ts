export const getNtrData = () =>
  typeof window === 'undefined' ? global.__NEXT_TRANSLATE_ROUTES_DATA : window.__NEXT_TRANSLATE_ROUTES_DATA
