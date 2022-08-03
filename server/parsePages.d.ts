import type { TRouteBranch } from '../types'

export declare type TParsePageTreeProps = {
  directoryPath: string
  pageExtensions: string[]
  isSubBranch?: boolean
  routesDataFileName?: string
}
/**
 * Recursively parse pages directory and build a page tree object
 */
export declare const parsePages: <L extends string>({
  directoryPath: propDirectoryPath,
  pageExtensions,
  isSubBranch,
  routesDataFileName,
}: TParsePageTreeProps) => TRouteBranch<L>
