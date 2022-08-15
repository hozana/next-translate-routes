import fs from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import pathUtils from 'path'
import YAML from 'yamljs'

import type { TRouteBranch, TRouteSegment, TRouteSegmentPaths, TRouteSegmentsData } from '../types'
import { fileNameToPath } from './fileNameToPaths'

/** Keep 'routes.json' for backward compatibility */
const DEFAULT_ROUTES_DATA_FILE_NAMES = ['_routes', 'routes']

/** Get path and path translations from name and all translations */
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
  const directoryPath = propDirectoryPath || findPagesDir(process.cwd()).pages
  const directoryItems = fs.readdirSync(directoryPath)
  const routesFileName = directoryItems.find((directoryItem) => {
    const fileNameNoExt = directoryItem.match(/^(.+)\.(json|yaml)$/)?.[1]
    return (
      fileNameNoExt &&
      (routesDataFileName
        ? fileNameNoExt === routesDataFileName
        : DEFAULT_ROUTES_DATA_FILE_NAMES.includes(fileNameNoExt))
    )
  })
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

  const children = directoryItems.reduce((acc, item) => {
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

  return {
    ...getRouteSegment(name, routeSegmentsData, true),
    children,
  }
}
