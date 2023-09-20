const parseVersion = (version?: string) =>
  version
    ?.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
    ?.slice(1)
    ?.filter(Boolean)
    ?.map(Number)

type TMinorPatch = `.${number}`
type TVersion = `${number}` | `${number}${TMinorPatch}` | `${number}${TMinorPatch}${TMinorPatch}`

export const checkNextVersion = (
  /** Ex: '>=13.3.1', '!=12.2.4' */
  version: `${'<' | '>' | '=' | '>=' | '<=' | '!='}${TVersion}`,
  /** Fallback if next version is not found */
  fallback = false,
) => {
  const referenceVersion = parseVersion(version)
  const nextVersion = parseVersion(process.env?.npm_package_dependencies_next)

  if (!referenceVersion || !nextVersion) {
    return fallback
  }

  let comparison = 0

  for (let i = 0; i < referenceVersion.length; i++) {
    if (nextVersion[i] > referenceVersion[i]) {
      comparison = 1
    } else if (nextVersion[i] < referenceVersion[i]) {
      comparison = -1
    }
  }

  if (
    (version.includes('!=') && comparison !== 0) ||
    (version.includes('=') && !version.includes('!=') && comparison === 0) ||
    (version.includes('<') && comparison === -1) ||
    (version.includes('>') && comparison === 1)
  ) {
    return true
  }

  return false
}
