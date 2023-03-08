import { getNtrData } from '../react/ntrData'
import { TFallbackLng, TRouteSegmentPaths } from '../types'

export const getPathFromPaths = <L extends string>({
  paths,
  locale,
}: {
  paths: TRouteSegmentPaths<L>
  locale: L | 'default'
}): string => {
  if (paths[locale]) {
    return paths[locale] || paths.default
  }
  const ntrData = getNtrData()
  if (!ntrData) {
    return paths.default
  }
  const { fallbackLng } = ntrData
  // const fallbackLng: TFallbackLng = {
  //   en: ['default'],
  //   default: [],
  // }

  if (fallbackLng && fallbackLng?.[locale]) {
    for (const l of fallbackLng[locale]) {
      if (paths[l as L]) {
        return paths[l as L] || paths.default
      }
    }
  }
  return paths.default
}
