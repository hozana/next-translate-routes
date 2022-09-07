import {
  matchAllFilepathPartsRegex,
  optionalMatchAllFilepathPartsRegex,
  dynamicFilepathPartsRegex,
} from '../shared/regex'

/** Transform Next file-system synthax to path-to-regexp synthax */
export const fileNameToPath = (fileName: string) =>
  fileName
    .replace(optionalMatchAllFilepathPartsRegex, ':$1*') // [[...param]]
    .replace(matchAllFilepathPartsRegex, ':$1+') // [...param]
    .replace(dynamicFilepathPartsRegex, ':$1') // [param]
