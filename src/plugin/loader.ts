import { ntrMessagePrefix } from '../shared/withNtrPrefix'
import type { TNtrData } from '../types'

export function loader(
  this: { query: { mustMatch?: boolean; data: TNtrData }; resourcePath: string },
  rawCode: string,
) {
  const uncommentedCode = rawCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')

  const defaultExportHocMatch = uncommentedCode.match(
    /^\s*import (\w+).* from ["']@almacareer\/edu-next-translate-routes["']/m,
  )
  const namedExportHocMatch = uncommentedCode.match(
    /^\s*import .*\{.*withTranslateRoutes(?: as (\w+))?\W?.*\} from ["']@almacareer\/edu-next-translate-routes["']/m,
  )

  const defaultExportHocName = defaultExportHocMatch?.[1]
  const namedExportHocName = namedExportHocMatch ? namedExportHocMatch[1] || 'withTranslateRoutes' : null

  if (!defaultExportHocName && !namedExportHocName) {
    if (this.query.mustMatch ?? true) {
      throw new Error(ntrMessagePrefix + `No withTranslateRoutes high order component found in ${this.resourcePath}.`)
    } else {
      return rawCode
    }
  }

  let result = rawCode

  ;[defaultExportHocName, namedExportHocName].forEach((name) => {
    if (name) {
      result = rawCode.replace(
        new RegExp(`(${name}\\()`, 'g'),
        `$1JSON.parse(\`${JSON.stringify(this.query.data, (_key, value) =>
          typeof value === 'string' ? value.replace('\\', '\\\\') : value,
        )}\`), `,
      )
    }
  })

  return result
}
