import type { TNtrData } from './types'

export default function loader(
  this: { query: { pagesPath: string; data: TNtrData }; resourcePath: string },
  rawCode: string,
) {
  // Normalize slashes in a file path to be posix/unix-like forward slashes
  const normalizedPagesPath = this.query.pagesPath.replace(/\\/g, '/')
  const normalizedResourcePath = this.resourcePath.replace(/\\/g, '/')

  // Skip if current resource is not _app file
  if (!normalizedResourcePath.startsWith(`${normalizedPagesPath}_app.`)) {
    return rawCode
  }

  const uncommentedCode = rawCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')

  const defaultExportHocMatch = uncommentedCode.match(/^\s*import (\w+).* from 'next-translate-routes'/m)
  const namedExportHocMatch = uncommentedCode.match(
    /^\s*import .*\{.*withTranslateRoutes(?: as (\w+))?\W?.*\} from 'next-translate-routes'/m,
  )

  const defaultExportHocName = defaultExportHocMatch?.[1]
  const namedExportHocName = namedExportHocMatch ? namedExportHocMatch[1] || 'withTranslateRoutes' : null

  if (!defaultExportHocName && !namedExportHocName) {
    throw new Error('[next-translate-routes] - No withTranslateRoutes high order component found in _app.')
  }

  let result = rawCode

  ;[defaultExportHocName, namedExportHocName].forEach((name) => {
    if (name) {
      result = rawCode.replace(
        new RegExp(`(${name}\\()`, 'g'),
        `$1JSON.parse(\`${JSON.stringify(this.query.data)}\`), `,
      )
    }
  })

  return result
}
