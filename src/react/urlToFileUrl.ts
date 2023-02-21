import { Key as PtrKey, match as ptrMatch, parse as ptrParse } from 'path-to-regexp'
import type { ParsedUrlQuery } from 'querystring'
import type { UrlObject } from 'url'

import { ignoreSegmentPathRegex, anyDynamicPathPatternPartRegex, anyDynamicFilepathPartsRegex } from '../shared/regex'
import type { TRouteBranch } from '../types'
import { getNtrData } from './ntrData'
import { parseUrl } from './parseUrl'
import { removeLangPrefix } from './removeLangPrefix'

enum MATCH_TYPE {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  MATCHALL = 'match-all',
}

type TParsedPathParts = { additionalQuery: ParsedUrlQuery; parsedPathParts: string[]; firstMatchType: MATCH_TYPE }

const getEndFilepathParts = ({ children = [] }: TRouteBranch, locale: string): TParsedPathParts | undefined => {
  for (const child of children) {
    const path = child.paths[locale] || child.paths.default
    if (path === 'index') {
      return { parsedPathParts: [], additionalQuery: {}, firstMatchType: MATCH_TYPE.STATIC }
    }
    if (ignoreSegmentPathRegex.test(path) && child.children?.length) {
      const descendantResult = getEndFilepathParts(child, locale)
      if (descendantResult) {
        return { ...descendantResult, parsedPathParts: [child.name, ...descendantResult.parsedPathParts] }
      }
    }
    const optionalMatchAllToken = ptrParse(path).find(
      (ptrToken) => typeof ptrToken === 'object' && ptrToken.modifier === '*',
    ) as PtrKey
    if (optionalMatchAllToken) {
      return {
        parsedPathParts: [child.name],
        additionalQuery: { [optionalMatchAllToken.name]: [] },
        firstMatchType: MATCH_TYPE.MATCHALL,
      }
    }
  }
  return undefined
}

/**
 * Recursively parse paths to identify the matching file path, and extract the parameters
 *
 * We must do this taking care of the priorities:
 * 1. static match among the current route branch children
 * 2. static match among among the descendants of a child that is path-ignored
 * 3. dynamic match among the current route branch children
 * 4. dynamic match among among the descendants of a child that is path-ignored
 * 5. match all match among the current route branch children
 * 6. match all match among among the descendants of a child that is path-ignored
 */
export const parsePathParts = ({
  locale,
  pathParts = [],
  routeBranch,
}: {
  locale: string
  /**
   * The path parts to parse using the routeBranch children
   * A path part can be a bare name or a dynamic value
   */
  pathParts?: string[]
  routeBranch: TRouteBranch
}): TParsedPathParts | undefined => {
  const { children } = routeBranch

  // If there is no path parts left to parse
  if (pathParts.length === 0) {
    if (!children?.length) {
      // The current routeBranch have no children, this is a match
      return { parsedPathParts: [], additionalQuery: {}, firstMatchType: MATCH_TYPE.STATIC }
    }

    return getEndFilepathParts(routeBranch, locale)
  }

  const currentPathPart = pathParts[0]
  const nextPathParts = pathParts.slice(1)

  // Ignore empty path parts
  if (!currentPathPart) {
    return parsePathParts({ locale, pathParts: nextPathParts, routeBranch })
  }

  // We are looking for the route matching the current path part among ther routeBranch children
  // It can be a static path part, or a dynamic path part (`[slug]` or `[...path]` for exemple)

  if (!children?.length) {
    // No match possible
    return undefined
  }

  // 1. Lets first look for static matches among the current children

  /** We will store here candidates that does not match statically */
  const delayedCandidates: { candidate: TRouteBranch; isPathIgnored?: boolean }[] = []
  let matchAllCandidate: TRouteBranch | undefined = undefined

  for (const candidate of children) {
    const path = candidate.paths[locale] || candidate.paths.default
    // Does the candidate statically match?
    if (path === currentPathPart) {
      // It does! But does its children match too?
      const childrenParsedPathParts = parsePathParts({ locale, pathParts: nextPathParts, routeBranch: candidate })
      if (childrenParsedPathParts) {
        // They do! Let's return the result immediately
        return {
          ...childrenParsedPathParts, // Keep additionalQuery
          parsedPathParts: [candidate.name, ...childrenParsedPathParts.parsedPathParts],
          firstMatchType: MATCH_TYPE.STATIC,
        }
      }
    }

    const isAnyDynamicPathPattern = anyDynamicPathPatternPartRegex.test(path)
    const isIgnorePathPattern = ignoreSegmentPathRegex.test(path)

    // Does the candidate path is static even if it does not match?
    if (!isAnyDynamicPathPattern && !isIgnorePathPattern) {
      // This candidate is static and does not match the currentPathPart: no need to check further
      continue
    }

    // So this candidate is not static
    // Let's classify it to use it later and first look for a static match (priority):
    // is it path-ignored, dynamic, or match-all?

    if (isIgnorePathPattern) {
      // It is path-ignored, let's unshift (hight priority) it among the delayedCandidates
      delayedCandidates.unshift({ candidate, isPathIgnored: true })
      continue
    } else if (
      ptrParse(path).some((ptrToken) => typeof ptrToken === 'object' && ['+', '*'].includes(ptrToken.modifier))
    ) {
      // It is a match-all path: let's store it alone (there can be only one)
      matchAllCandidate = candidate
    } else {
      // It is a dynamic path, let's push (low priority) it among the delayedCandidates
      delayedCandidates.push({ candidate, isPathIgnored: false })
    }
  }

  // Now we know that there is no static match among these children
  // 2. & 3.Let's take care of these delayed candidates

  /**
   * We will store here the non static matches from path-ignored candidates
   * to handle them if there is not dynamic match among the current children
   */
  const pathIgnoredResults: Partial<Record<MATCH_TYPE, TParsedPathParts>> = {}

  for (const { candidate, isPathIgnored } of delayedCandidates) {
    if (isPathIgnored) {
      // 2. Let's look among the descendants of this path-ignored candidate
      const rawResult = parsePathParts({
        locale,
        routeBranch: candidate,
        pathParts,
      })
      if (rawResult) {
        // Found a match

        const result = {
          ...rawResult, // Keep the additionalQuery and firstMatchType
          parsedPathParts: [candidate.name, ...rawResult.parsedPathParts],
        }

        if (rawResult.firstMatchType === MATCH_TYPE.STATIC) {
          // Static match: that's it, let's take this one

          return result
        } else {
          // Let's store it for now, we will use it if we don't find something better
          pathIgnoredResults[rawResult.firstMatchType] = result
        }
      }
    } else {
      // 3. If we are here, it means that we did not find any static match, even among path-ignored candidates descendants,
      // because we sorted the candidates in the delayedCandidates array: first the path-ignored candidates, then the dynamic ones.
      const path = candidate.paths[locale] || candidate.paths.default
      const match = ptrMatch<ParsedUrlQuery>(path)(currentPathPart)
      if (match) {
        // It matches! But does its children match too?
        const childrenParsedPathParts = parsePathParts({ locale, pathParts: nextPathParts, routeBranch: candidate })
        if (childrenParsedPathParts) {
          // They do! Let's return the result immediately
          return {
            parsedPathParts: [candidate.name, ...childrenParsedPathParts.parsedPathParts],
            additionalQuery: { ...childrenParsedPathParts.additionalQuery, ...match.params },
            firstMatchType: MATCH_TYPE.DYNAMIC,
          }
        }
      }
    }
  }

  // 4. Do we have a dynamic match stored in the pathIgnoredMatches?
  if (pathIgnoredResults[MATCH_TYPE.DYNAMIC]) {
    // Yes, let's return it
    return pathIgnoredResults[MATCH_TYPE.DYNAMIC]
  }

  // 5. Do we have a matchAllCandidate stored?
  if (matchAllCandidate) {
    // Yes.
    const path = matchAllCandidate.paths[locale] || matchAllCandidate.paths.default
    const match = ptrMatch<ParsedUrlQuery>('/' + path)('/' + pathParts.join('/'))
    if (match) {
      // It matches! And it does not have children (or should not).
      return {
        parsedPathParts: [matchAllCandidate.name],
        additionalQuery: match.params,
        firstMatchType: MATCH_TYPE.MATCHALL,
      }
    }
  }

  // 6. Do we have a match all match stored in the pathIgnoredMatches?
  if (pathIgnoredResults[MATCH_TYPE.DYNAMIC]) {
    // Yes, let's return it
    return pathIgnoredResults[MATCH_TYPE.DYNAMIC]
  }

  // Still there? No match then.
  return undefined
}

/**
 * Parse a translated url to get the corresponding file url (UrlObject)
 *
 * Ex: `urlToFileUrl('/fr/mon/url/de/france', 'fr')` => `{ pathname: '/my/url/from/[country], query: { country: 'france' } }`
 *
 * @param url The url to parse: can be a string, an URL or an UrlObject
 * @param locale (optional) The locale corresponding to the url translation.
 * If omitted, urlToFileUrl will look for the locale in the first path part.
 * If it does not match a locale, urlToFileUrl will use the default locale.
 *
 * @returns The file path based, Next.js format, url in UrlObject format
 * if the url successfully matched a file path, and undefined otherwise
 */
export const urlToFileUrl = (url: string | URL | UrlObject, locale?: string) => {
  const { routesTree, defaultLocale, locales } = getNtrData()
  const { pathname, query, hash } = parseUrl(url)

  if (pathname && anyDynamicFilepathPartsRegex.exec(pathname)) {
    // The given url seems to already be a fileUrl, return it as is.
    // Not sure if we should return undefined instead. Or throw?
    return { pathname, query, hash }
  }

  const result = parsePathParts({
    locale: locale || defaultLocale || locales[0],
    routeBranch: routesTree,
    pathParts: removeLangPrefix(pathname || '/', true, locale),
  })
  if (result) {
    const { parsedPathParts, additionalQuery } = result
    return {
      pathname: `/${parsedPathParts.join('/')}`,
      query: { ...query, ...additionalQuery },
      ...(hash && { hash }),
    }
  }
  return undefined
}
