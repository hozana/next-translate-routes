import type { TRouteBranch } from './types'

export const getRoutesTree = () => JSON.parse(process.env.NEXT_PUBLIC_ROUTES || 'null') as TRouteBranch
export const getLocales = () => (process.env.NEXT_PUBLIC_LOCALES || '').split(',') as string[]
export const getDefaultLocale = () => process.env.NEXT_PUBLIC_DEFAULT_LOCALE as string
