import type { ParsedUrlQuery } from 'querystring'
import type { UrlObject } from 'url'

import { getNtrData } from '../shared/ntrData'
import {
  anyDynamicFilepathPartRegex,
  dynamicFilepathPartsRegex,
  getCatchAllPathPartKey,
  getDynamicPathPartKey,
  getOptionalCatchAllPathPartKey,
  matchAllFilepathPartsRegex,
  optionalMatchAllFilepathPartRegex,
  spreadFilepathPartRegex,
} from '../shared/regex'
import type { TRouteBranch } from '../types'
import { parseUrl } from './parseUrl'

/**
 * Get the route branch name from a route branch based on the locale or the name if no value for locale is found
 */
const getRouteBranchName = (routeBranch: TRouteBranch, locale: string) => {
  if (!routeBranch?.name && routeBranch?.paths?.[locale]) {
    return ''
  }

  if (routeBranch?.paths?.[locale]) {
    return routeBranch?.paths?.[locale]
  }

  if (routeBranch?.name) {
    return routeBranch?.name
  }

  return ''
}

/**
 * Recursively get path file UrlObject from a route branch
 */
const getFileUrlObject = ({
  routeBranch,
  pathParts,
  locale,
}: {
  routeBranch: TRouteBranch
  /** Remaining path parts after the `routeBranch` path parts */
  pathParts: string[]
  locale: string
}): { pathname: string; query?: ParsedUrlQuery } => {
  const routeBranchName = getRouteBranchName(routeBranch, locale)

  // console.log('routeBranch', routeBranch)
  // console.log('routeBranchName', routeBranchName)

  if (pathParts.length === 0) {
    const optionalMatchAllChild = routeBranch.children?.find((child) =>
      optionalMatchAllFilepathPartRegex.test(child.name),
    )

    if (optionalMatchAllChild) {
      return {
        pathname: `/${routeBranchName}/${optionalMatchAllChild.name}`,
        query: {},
      }
    }

    return { pathname: `/${routeBranchName}`, query: {} }
  }

  const [nextPathPart, ...remainingPathParts] = pathParts

  // Next parts path: looking for the child corresponding to nextPathPart:
  // if nextPathPart does not match any child name and a dynamic child is found,
  // we will consider that nextPathPart is a value given to the dynamic child

  let matchingChild: TRouteBranch | undefined = undefined

  for (const child of routeBranch.children || []) {
    if (
      // child.children must be coherent with remaining path parts is case a file and and folder share the same name
      remainingPathParts.length === 0 ||
      child.children?.length
    ) {
      if (child.name === nextPathPart || child?.paths?.[locale] === nextPathPart) {
        matchingChild = child
        break
      } else if (
        // If nextPathPart already have a dynamic syntax, it must match the name, no need to go further
        !anyDynamicFilepathPartRegex.test(nextPathPart) &&
        // If the current child is dynamic and...
        anyDynamicFilepathPartRegex.test(child.name) &&
        // ...there is no matching child found for now, or...
        (!matchingChild ||
          // ...the matchingChild has a spread syntax and the new one has not (priority)
          (spreadFilepathPartRegex.test(matchingChild.name) && dynamicFilepathPartsRegex.test(child.name)))
      ) {
        matchingChild = child
      }
      // Else if the child is a catch all or optional catch all route, we will consider it as a match
    } else if (matchAllFilepathPartsRegex.test(child.name) || optionalMatchAllFilepathPartRegex.test(child.name)) {
      matchingChild = child
      break
    }
  }

  if (matchingChild) {
    /** If we found an exact match, no need to add query */
    const isExactMatch = matchingChild.name === nextPathPart

    const dynamicPathPartKey = getDynamicPathPartKey(matchingChild.name)
    const catchAllPathPartKey = getCatchAllPathPartKey(matchingChild.name)
    const optionalCatchAllPathPartKey = getOptionalCatchAllPathPartKey(matchingChild.name)

    if (catchAllPathPartKey || optionalCatchAllPathPartKey) {
      const query = {
        ...(catchAllPathPartKey ? { [catchAllPathPartKey]: pathParts } : {}),
        ...(optionalCatchAllPathPartKey ? { [optionalCatchAllPathPartKey]: pathParts } : {}),
      }

      return {
        pathname: `${routeBranchName ? `/${routeBranchName}` : ''}/${matchingChild.name}`,
        query,
      }
    }

    const { pathname: nextPathname, query: nextQuery } = getFileUrlObject({
      routeBranch: matchingChild,
      pathParts: remainingPathParts,
      locale,
    })

    const pathname = `${routeBranchName ? `/${routeBranchName}` : ''}${nextPathname}`

    const query =
      isExactMatch || !dynamicPathPartKey
        ? nextQuery
        : {
            [dynamicPathPartKey]: spreadFilepathPartRegex.test(matchingChild.name) ? pathParts : nextPathPart,
            ...nextQuery,
          }

    return { pathname, query }
  }

  throw new Error(`No "/${pathParts.join('/')}" page found in /${routeBranch.name} folder.`)
}

/**
 * Get the file UrlObject matching a string file url
 *
 * Ex: Given `/[dynamic]/path` is an existing file path,
 *
 * `/value/path?foo=bar` => { pathname: `/[dynamic]/path`, query: { dynamic: 'value', foo: 'bar' } }
 *
 * @throws if the fileUrl input does not match any page
 */
export const fileUrlToFileUrlObject = ({ fileUrl, locale }: { fileUrl: string | UrlObject | URL; locale: string }) => {
  const { pathname: rawPathname, query: initialQuery, ...rest } = parseUrl(fileUrl)

  const { routesTree } = getNtrData()
  if (!routesTree.children) {
    throw new Error('No page found. You probably need to add the pageDirectory option in your translateRoutes config.')
  }

  const { pathname, query } = getFileUrlObject({
    pathParts: (rawPathname || '/').split('/').filter(Boolean),
    routeBranch: routesTree,
    locale,
  })

  return { pathname, query: { ...query, ...initialQuery }, ...rest }
}
