import {
  matchAllFilepathPartsRegex,
  optionalMatchAllFilepathPartRegex,
  dynamicFilepathPartsRegex,
} from '../shared/regex'

/** Transform Next file-system syntax to path-to-regexp syntax */
export const fileNameToPath = (fileName: string) =>
  fileName
    .replace(optionalMatchAllFilepathPartRegex, ':$1*') // [[...param]]
    .replace(matchAllFilepathPartsRegex, ':$1+') // [...param]
    .replace(dynamicFilepathPartsRegex, ':$1') // [param]
