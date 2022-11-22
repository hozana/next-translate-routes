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

/**
 * Get pages dir, trying both .pages (next < 13) and .pagesDir (next >= 13) syntaxes
 */
export const getPagesDir = () =>
  findPagesDir(process.cwd(), false).pages || (findPagesDir(process.cwd(), false) as Record<string, string>).pagesDir

export const getAllRoutesFiles = (directoryPath = getPagesDir(), routesDataFileName?: string): string[] => {
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
