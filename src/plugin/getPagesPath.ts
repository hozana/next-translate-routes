import fs from 'fs'
import pathUtils from 'path'

import { ntrMessagePrefix } from '../shared/withNtrPrefix'

export const getPagesPath = (pagesDirectory?: string) => {
  const pagesDir = ['pages', 'src/pages', 'app/pages', 'integrations/pages', pagesDirectory].find(
    (dirPath) => dirPath && fs.existsSync(pathUtils.join(process.cwd(), dirPath)),
  )

  if (!pagesDir) {
    throw new Error(ntrMessagePrefix + 'No pages folder found.')
  }

  return pathUtils.join(process.cwd(), pagesDir, '/')
}
