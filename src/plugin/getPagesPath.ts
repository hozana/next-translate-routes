import fs from 'fs'
import pathUtils from 'path'

export const getPagesPath = (pagesDirectory?: string) => {
  const pagesDir = ['pages', 'src/pages', 'app/pages', 'integrations/pages', pagesDirectory].find(
    (dirPath) => dirPath && fs.existsSync(pathUtils.join(process.cwd(), dirPath)),
  )

  if (!pagesDir) {
    throw new Error('[next-translate-routes] - No pages folder found.')
  }

  return pathUtils.join(process.cwd(), pagesDir, '/')
}
