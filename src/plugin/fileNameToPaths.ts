/** Transform Next file-system synthax to path-to-regexp synthax */
export const fileNameToPath = (fileName: string) =>
  fileName
    .replace(/\[\[\.\.\.(\S+)\]\]/g, ':$1*') // [[...param]]
    .replace(/\[\.\.\.(\S+)\]/g, ':$1+') // [...param]
    .replace(/\[(\S+)\]/g, ':$1') // [param]
