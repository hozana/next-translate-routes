# Todo

BUG !
Il y a un rechargement quand on change de page vers une page qui a getServerSideProps ou getStaticProps !!!
BUG !

- check if the prefetch works in all conditions (with `yarn build && yarn start`)
  =>`href={parseUrlString(url)}` in link?
- add exclude options to sort and exclude redirects/rewrites
- fix looping redirect for /fr/bible
- check pageExtensions before adding a page in the routesTree
- check basePath compatibility
- check middleware issue advancement
- check if and where special characters should be escaped (<https://nextjs.org/docs/api-reference/next.config.js/rewrites#regex-path-matching>)
- validate custom pagesTree
- throw if destination is equal to source
- trow helpful errors (ex: for `compile(path)(augmentedQuery)` in case the query parameters for a dynamic segment is missing)
- improve comments, code documentation: ex. in `getAllCandicates`, why `path === ''` and not `/^\.(\(.+\))?$/.test(path)`???
- getRouteList: (locale?: string) => (? Record<string, string[]> ? string? string[]?)
- create a function `getRouteSegments(filePath: string): TRouteSegment[]`
  - return the whole path as is if not found and not dynamic file path
- export a routeExist function
