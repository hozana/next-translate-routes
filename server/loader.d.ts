import type { TNtrData } from '../types'

export declare function loader(
  this: {
    query: {
      pagesPath: string
      data: TNtrData
    }
    resourcePath: string
  },
  rawCode: string,
): string
