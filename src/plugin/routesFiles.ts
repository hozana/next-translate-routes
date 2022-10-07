import fs from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import pathUtils from 'path'

/** Keep 'routes.json' for backward compatibility */
const DEFAULT_ROUTES_DATA_FILE_NAMES = ['_routes', 'routes']

export const isRoutesFileName = (fileName: string, routesDataFileName?: string) => {
  const fileNameNoExt = fileName.match(/^(.+)\.(json|yaml)$/)?.[1]
  return (
    fileNameNoExt &&
    (routesDataFileName ? fileNameNoExt === routesDataFileName : DEFAULT_ROUTES_DATA_FILE_NAMES.includes(fileNameNoExt))
  )
}

export const getAllRoutesFiles = (
  directoryPath = findPagesDir(process.cwd()).pages,
  routesDataFileName?: string,
): string[] => {
  const directoryItems = fs.readdirSync(directoryPath)
  return directoryItems.reduce((acc, directoryItem) => {
    const itemPath = pathUtils.join(directoryPath, directoryItem)
    if (fs.statSync(itemPath).isDirectory()) {
      return [...acc, ...getAllRoutesFiles(itemPath, routesDataFileName)]
    }
    if (isRoutesFileName(directoryItem, routesDataFileName)) {
      return [...acc, itemPath]
    }
    return acc
  }, [] as string[])
}
