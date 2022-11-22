import fs from 'fs'
import pathUtils from 'path'
import YAML from 'yamljs'

import { anyDynamicFilepathPartRegex, spreadFilepathPartRegex } from '../shared/regex'
import type { TRouteBranch, TRouteSegment, TRouteSegmentPaths, TRouteSegmentsData } from '../types'
import { fileNameToPath } from './fileNameToPaths'
import { getPagesDir, isRoutesFileName } from './routesFiles'

/** Get path and path translations from name and all translations #childrenOrder */
const getRouteSegment = <L extends string>(
  name: string,
  routeSegmentsData: TRouteSegmentsData<L>,
  isDirectory?: boolean,
): TRouteSegment<L> => {
  const routeSegmentData = routeSegmentsData?.[isDirectory ? '/' : name]
  const { default: defaultPath = fileNameToPath(name), ...localized } =
    typeof routeSegmentData === 'object' ? routeSegmentData : { default: routeSegmentData }
  const paths = {
    default: defaultPath,
    ...localized,
  } as TRouteSegmentPaths<L>
  return {
    name,
    paths,
  }
}

/** Attribute a weight to a route branch so that they can be sorted: the heaviest must be the last */
const getOrderWeight = ({ name, children }: TRouteBranch) => {
  let weight = 0
  ;[spreadFilepathPartRegex.test(name), anyDynamicFilepathPartRegex.test(name), children?.length].forEach(
    (condition) => {
      if (condition) {
        weight++
      }
    },
  )
  return weight
}

export type TParsePageTreeProps = {
  directoryPath: string
  pageExtensions: string[]
  isSubBranch?: boolean
  routesDataFileName?: string
}

/**
 * Recursively parse pages directory and build a page tree object
 */
export const parsePages = <L extends string>({
  directoryPath: propDirectoryPath,
  pageExtensions,
  isSubBranch,
  routesDataFileName,
}: TParsePageTreeProps): TRouteBranch<L> => {
  const directoryPath = propDirectoryPath || getPagesDir()
  const directoryItems = fs.readdirSync(directoryPath)
  const routesFileName = directoryItems.find((directoryItem) => isRoutesFileName(directoryItem, routesDataFileName))
  const routeSegmentsFileContent = routesFileName
    ? fs.readFileSync(pathUtils.join(directoryPath, routesFileName), { encoding: 'utf8' })
    : ''
  const routeSegmentsData = (
    routeSegmentsFileContent
      ? (/\.yaml$/.test(routesFileName as string) ? YAML : JSON).parse(routeSegmentsFileContent)
      : {}
  ) as TRouteSegmentsData<L>
  const directoryPathParts = directoryPath.replace(/[\\/]/, '').split(/[\\/]/)
  const name = isSubBranch ? directoryPathParts[directoryPathParts.length - 1] : ''

  const children = directoryItems
    .reduce((acc, item) => {
      const isDirectory = fs.statSync(pathUtils.join(directoryPath, item)).isDirectory()
      const pageMatch = item.match(new RegExp(`(.+)\\.(${pageExtensions.join('|')})$`))
      const pageName = (!isDirectory && pageMatch?.[1]) || ''

      if (!isSubBranch && (['_app', '_document', '_error', '404', '500'].includes(pageName) || item === 'api')) {
        return acc
      }

      if (isDirectory || pageName) {
        return [
          ...acc,
          isDirectory
            ? parsePages({
                directoryPath: pathUtils.join(directoryPath, item),
                isSubBranch: true,
                pageExtensions,
                routesDataFileName,
              })
            : getRouteSegment(pageName || item, routeSegmentsData),
        ]
      }
      return acc
    }, [] as TRouteBranch<L>[])
    .sort((childA, childB) => getOrderWeight(childA) - getOrderWeight(childB))

  return {
    ...getRouteSegment(name, routeSegmentsData, true),
    children,
  }
}
