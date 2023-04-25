import { getNtrData } from '../react/ntrData'
import type { TRouteSegmentPaths } from '../types'

const getFallbackLngs = (lng: string): string[] | undefined => {
  const { fallbackLng } = getNtrData() || {}

  if (!fallbackLng) {
    return undefined
  }
  if (typeof fallbackLng === 'string') {
    return [fallbackLng]
  }
  return Array.isArray(fallbackLng) ? fallbackLng : fallbackLng[lng]
}

/**
 * Get the locale path part from a route segment `paths` property and a locale.
 *
 * Ex:
 * ```
 * getPathFromPaths({ default: '/here', fr: '/ici', es: '/aqui' }, 'fr') // '/ici'
 *
 * // If no fallbackLng is defined:
 * getPathFromPaths({ default: '/here', fr: '/ici', es: '/aqui' }, 'pt') // '/here'
 * // If ntrData.fallbackLng.pt === ['es', 'fr'], then:
 * getPathFromPaths({ default: '/here', fr: '/ici', es: '/aqui' }, 'pt') // '/aqui'
 * ```
 */
export const getLocalePathFromPaths = <L extends string>({
  paths,
  locale,
}: {
  paths: TRouteSegmentPaths<L>
  locale: L | 'default'
}): string => {
  if (paths[locale]) {
    return paths[locale] as string
  }

  const fallbackLngs = getFallbackLngs(locale)
  if (fallbackLngs) {
    for (const l of fallbackLngs) {
      if (paths[l as L]) {
        return paths[l as L] as string
      }
    }
  }
  return paths.default
}
