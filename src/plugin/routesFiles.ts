import fs from 'fs'
import { findPagesDir } from 'next/dist/lib/find-pages-dir'
import pathUtils from 'path'

import { ntrMessagePrefix } from '../shared/withNtrPrefix'

/** Keep 'routes.json' for backward compatibility */
const DEFAULT_ROUTES_DATA_FILE_NAMES = ['_routes', 'routes']

export const isRoutesFileName = (fileName: string, routesDataFileName?: string) => {
  const fileNameNoExt = /^(.+)\.(json|ya?ml)$/.exec(fileName)?.[1]
  return (
    fileNameNoExt &&
    (routesDataFileName ? fileNameNoExt === routesDataFileName : DEFAULT_ROUTES_DATA_FILE_NAMES.includes(fileNameNoExt))
  )
}

/**
 * Get pages dir, trying both .pages (next < 13) and .pagesDir (next >= 13) syntaxes
 */
export const getPagesDir = () => {
  // @ts-expect-error: support previous Next versions
  const pagesDirs = findPagesDir(process.cwd(), false)
  const pagesDir =
    typeof pagesDirs === 'object'
      ? (pagesDirs as Record<string, string | undefined>).pages || pagesDirs.pagesDir
      : pagesDirs

  if (!pagesDir) {
    throw new Error(
      ntrMessagePrefix +
        '`/pages` directory not found.' +
        (pagesDirs.appDir ? ' next-translate-routes does not support `/app` directory yet.' : ''),
    )
  }

  return pagesDir
}

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
