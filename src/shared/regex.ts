/**
 * A segment can be ignored by setting its path to `"."` in _routes.json.
 * It can be done for some lang only and not others.
 *
 * ⚠️ It can cause troubles with the **redirections**.
 *
 * Ex: given the `/a/[b]/[c]` and `/a/[b]/[c]/d` file paths where `[b]` is ignored and the b param is merged with the c param: `:b-:c`.
 * `/a/:b/:c` => `/a/:b-:c` and `/a/:b/:c/d` => `/a/:b-:c/d`
 * Then `/a/bb/11` will be redirected to `/a/bb-11` and `/a/bb/11/d` to `/a/bb-11/d` and that is fine.
 * But then `/a/bb-11/d` will match `/a/:b-:c` and be redirected to `/a/bb-11-d` and that is not fine!
 *
 * To handle this case, one can add a path-to-regex pattern to the default ignore token. Ex: `.(\\d+)`, or `.(\[\^-\]+)`, or `.(\what|ever\)`.
 * This path-to-regex pattern will be added after the segment name in the redirect.
 * `/a/:b(\[\^-\]+)/:c` => `/a/:b-:c` and `/a/:b(\[\^-\]+)/:c/d` => `/a/:b-:c/d`
 * Then `/a/bb-11/d` will no more match `/a/[b]/[c]` (`/a/:b(\[\^-\]+)/:c`).
 *
 * ⚠️ This is only handled in default paths (i.e. `"/": ".(\\d+)"` or `"/": { "default": ".(\\d+)" }`), not in lang-specific paths.
 *
 * #ignorePattern
 */
export const ignoreSegmentPathRegex = /^\.(\(.+\))?$/

/**
 * Ex: `[slug]` or `[...pathParts]` or `[[...pathParts]]`
 */
export const anyDynamicFilepathPartRegex = /^\[\[?(?:\.{3})?([^/[\]?#]+)\]?\]$/

/**
 * Match all dynamic parts: `[slug]` and `[...pathParts]` and `[[...pathParts]]`
 */
export const anyDynamicFilepathPartsRegex = /\[\[?(?:\.{3})?([^/[\]?#]+)\]?\]/g

/**
 * Ex: `:slug` or `:pathParts*` or `:pathParts+` or `foo-:bar`
 */
export const anyDynamicPathPatternPartRegex = /(?:^|[^\\]):[\d\w]+/

/**
 * Ex: `[[...pathParts]]`
 */
export const optionalMatchAllFilepathPartRegex = /^\[\[\.{3}([^/[\]?#]+)\]\]$/

/**
 * Match all `[[...pathParts]]` parts
 */
export const optionalMatchAllFilepathPartsRegex = /\[\[\.{3}([^/[\]?#]+)\]\]/g

/**
 * Match all `[...pathParts]` parts but not `[[...pathParts]]` parts
 */
export const matchAllFilepathPartsRegex = /\[\.{3}([^/[\]?#]+)\]/g

/**
 * A "spread path part" is either a match-all path part (`[...pathParts]`),
 * either an optional match all path part (`[[...pathParts]]`)
 */
export const spreadFilepathPartRegex = /^\[\[?\.{3}([^/[\]?#]+)\]?\]$/

/** Ex: `'[...pathParts]'` => `'pathParts'` and `'[[...pathParts]]'` => `pathParts` but `'[slug]'` => `null` and `'pathPart'` => `null` */
export const getSpreadFilepathPartKey = (pathPart: string) => spreadFilepathPartRegex.exec(pathPart)?.[1] || null

/**
 * Ex: `[slug]` and neither `[...pathParts]` nor `[[...pathParts]]`
 */
export const dynamicFilepathPartRegex = /^\[(?!\.{3})([^/[\]?#]*)\]$/

/** Ex: `'[slug]'` => `'slug'` but `'[...pathParts]'` => `null` and '`pathPart'` => `null` */
export const getDynamicPathPartKey = (pathPart: string) => dynamicFilepathPartRegex.exec(pathPart)?.[1] || null

/**
 * Match all `[slug]` parts but neither `[...pathParts]` parts nor `[[...pathParts]]` parts
 */
export const dynamicFilepathPartsRegex = /\[(?!\.{3})([^/[\]?#]*)\]/g
