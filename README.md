# Next-translate-routes

Translated routing and more for Next using Next regular file-base routing system

- [Features](#features)
  - [Yet unsupported features](#yet-unsupported-features)
- [Motivation](#motivation)
- [How to](#how-to)
  - [Basic usage](#basic-usage)
    1. [Wrap you next config with the next-translate-routes plugin](#1-wrap-you-next-config-with-the-next-translate-routes-plugin)
    2. [Define your routes](#2-define-your-routes)
    3. [Wrap your `\_app` component with the `withTranslateRoutes` hoc](#3-wrap-you-_app-component-with-the-withtranslateroutes-hoc)
    4. [Use `next-translate-routes/link` instead of `next/link`](#4-use-next-translate-routeslink-instead-of-nextlink)
    5. [Use `next-translate-routes/router instead` of `next/router` for singleton router (default export)](#5-use-next-translate-routesrouter-instead-of-nextrouter-for-singleton-router-default-export)
  - [Advanced usage](#advanced-usage)
    - [Configuration](#configuration)
    - [Translate/untranslate urls](#translateuntranslate-urls)
    - [Alternate pages (SEO)](#alternate-pages-seo)
    - [Sitemap](#sitemap)
    - [Constrained dynamic paths segments](#constrained-dynamic-paths-segments)
    - [Ignoring a path part](#ignoring-a-path-part)
    - [Complex paths segments](#complex-paths-segments)
    - [Custom route tree](#custom-route-tree)
    - [Outside Next](#outside-next)
    - [Fallback languages](#fallback-languages)
- [Known issue](#known-issues)
  - [Middleware with Next >=12.2.0](#middleware-with-watcher-next-1220)
  - [Optional catch all with rewrites](#optional-catch-all-with-rewrites)
  - [With @sentry/nextjs](#with-sentrynextjs)
- [How does it work](#how-does-it-work)

## Features

- **Translated paths segments**  
  Ex: `/contact-us` and `/fr/contactez-nous`.
- **Complex paths segments** (path-to-regexp syntax)  
  Ex: `/:id{-:slug}?/`
- **Constrained dynamic paths segments** (path-to-regexp syntax)  
  Ex: `/:id(\\d+)/`
- **No duplicated content (SEO)**  
  Simple rewrites would make a page accessible with 2 different urls which is bad for SEO.
- **Auto-redirection to correct translated path**  
  Ex: `/fr/english/path` redirects to `/fr/french/path`
- **No custom server needed!**  
  Next automatic static optimization remains available.

See it in action: <https://codesandbox.io/s/github/hozana/next-translate-routes/tree/master>

### Yet unsupported features

- Html static export is not and will never be supported by next-translate-routes, since internationalized routing is among [static html export unsupported features](https://nextjs.org/docs/advanced-features/static-html-export#unsupported-features).
- Domain routing is not supported yet but should be in the future.
- Next 13 is not supported yet too. There is two steps here:
  - supporting next 13 without `app/` directory: it nearly works, but there is some issues. To fix them, we need to figure out what is optimistic navigation. If anyone has a clue, please open an issue to discuss it!
  - supporting the `app/` directory. And that won't be a piece of cake...

Any PR are welcome!

## Motivation

To build a fully internationalized website, one need to translate url segments: it is important for UX and SEO.
For now, Next only ship with locale prefixes ([see Next.js internationalized routing doc](https://nextjs.org/docs/advanced-features/i18n-routing)).

The [next-routes](https://github.com/fridays/next-routes) package allow fully internationalized routing but it is no longer maintained, and it is designed without the latest Next api, such as internationalized routing, new data fetching methods, automatic static optimization.  
To be able to use theses, a new approach is needed. Next.js provides it with [Redirects](https://nextjs.org/docs/api-reference/next.config.js/redirects) and [Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites), but:

- the main problem is that writing the rewrites and redirects to translate all the routes by hand is long, boring, error-prone, and hard to maintain.
- an other problem is that by default, the file path works with all the locale prefixes: it creates 2 urls for the same content, which is not good for SEO. This problem can be worked around by creating redirects from `/${localePrefix}/$(filePath)` to `/${localePrefix}/$(localePath)`, but it creates a lot more complexity to write by hand and maintain.

## How to

### Basic usage

Check the example folder to see next-translate-routes in action. Some advanced techniques are shown there too: they may seem complicated but those 4 steps should cover most of the cases.

#### 1. Wrap you next config with the next-translate-routes plugin

Import the `withTranslateRoutes` from `next-translate-routes/plugin`.

```javascript
// next.config.js
const withTranslateRoutes = require('next-translate-routes/plugin')

module.exports = withTranslateRoutes({
  // Next i18n config (mandatory): https://nextjs.org/docs/advanced-features/i18n-routing
  i18n: {
    locales: ['en', 'fr', 'es', 'pl'],
    defaultLocale: 'pl',
  },

  // ...Remaining next config
})
```

#### 2. Define your routes

You can add a `_routes.json`, or a `_routes.yaml`, file in the `pages` folder, and in the every subfolder where you want to define routes.

Given a folder structure like so, you can add a `_routes.json` in `/pages/` and in `/pages/section/`.

```none
/pages/
 ├ section/
 | ├ page1.tsx
 | ├ page2.tsx
 | └ _routes.json
 ├ somewhere/
 | └ else.json
 ├ _app.tsx
 ├ about.tsx
 ├ contact.tsx
 └ _routes.json
```

In `/pages/section/`, the `_routes.json` file could look like this.

```json
// `/pages/section/_routes.json`
{
  "/": {
    "es": "seccion" // Folder path in es
  },
  "page1": {
    "default": "article", // Overwrite the default page path (fallback)
    "es": "articulo"
  },
  "page2": "definition" // Overwrite the page path for all language
}
```

The `"/": { ... }` part define the folder paths, each other section define the paths of a page file in this folder:

- page1 will be accessible at `/seccion/articulo` in `es`, and at `/section/article` in other languages,
- page2 will be accessible at `/seccion/definition` in `es`, and at `/section/definition` in other languages.

You don't need a `_routes.json` file in folder where you don't customize anything. If it is empty, then delete it.
Here, the `/somewhere/` subfolder does not have any `_routes.json` file.

Then, in `/pages/`, the `_routes.json` file could look like this.

```json
// `/pages/_routes.json`
{
  "/": {
    "pt": "blog" // As we are in the root pages folder, this will add a "blog" path prefix for all pages in pt
  },
  "contact": {
    "es": "contactar",
    "pt": "contatar"
  }
}
```

In the root pages folder, the `"/": { ... }` part of the root `_routes.json` allows to add a different basePath
for each language or only some language, like "blog" in `pt` here:

- about will be accessible at `/blog/about` in `pt` and at `/about` in other languages,
- contact will be accessible at `/blog/contatar` in `pt`, at `/contactar` in `es` and at `/contact` in other languages,
- page1 will in fact be accessible at `/blog/section/article` in `pt`,
- page2 will in fact be accessible at `/blog/section/definition` in `pt`.

#### 3. Wrap you `\_app` component with the `withTranslateRoutes` hoc

```js
// `/pages/_app.js`
import { withTranslateRoutes } from 'next-translate-routes'
import { App } from 'next/app'

export default withTranslateRoutes(App)
```

Or:

```js
// `/pages/_app.js`
import { withTranslateRoutes } from 'next-translate-routes'

const App = ({ Component, pageProps }) => {
  // Custom code...

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
```

#### 4. Use `next-translate-routes/link` instead of `next/link`

next-translate-routes extends Next Link to translate routes automatically: import it from 'next-translate-routes/link' instead of 'next/link' and use as you ever did.

```jsx
import Link from 'next-translate-routes/link'
import React, { useEffect, useState } from 'react'

const MyLinks = (props) => {
  const { locales } = useRouter()

  return (
    <>
      <Link href="/file/path/to/page">Current locale</Link>
      {locales.map((locale) => (
        <Link
          href={{ pathname: '/file/path/to/[dynamic]/page', query: { dynamic: props.param, otherQueryParam: 'foo' } }}
          locale={locale}
          key={locale}
        >
          {locale}
        </Link>
      ))}
    </>
  )
}
```

#### 5. Use `next-translate-routes/router instead` of `next/router` for singleton router (default export)

You can use `next-translate-routes/router` everywhere instead of `next/router` but it is only necessary for the singleton router (which is rarely used).

```typescript
import singletonRouter from 'next-translate-routes/router'
// Indead of:
import singletonRouter from 'next/router'
```

### Advanced usage

Check the example folder to see some advanced techniques in action.

#### Configuration

Next-translate-routes is configurable by adding a `translateRoutes` key in Next config that accept an object of the following `NTRConfig` type.

```ts
type NTRConfig = {
  debug?: boolean
  routesDataFileName?: string
  routesTree?: TRouteBranch<L>
  pagesDirectory?: string
}
```

<details>
  <summary>See more about TRouteBranch</summary>

  > If `i18n.locales` is set to `['en', 'fr']`, then the `TRouteBranch` generic `L` prop would be `'en' | 'fr'`. A non-generic equivalent of `TRouteBranch<'en' | 'fr'>` would be the following.
  >
  > ```ts
  > /** Non generic version of the TRouteBranch type for better readability, where the generi L prop is set to `'en' | 'fr'` */
  > type TRouteBranchEnFr = {
  >   name: string
  >   en: string
  >   fr: string
  >   children: TRouteBranchEnFr[]
  > }
  > ```

</details>

```js
  translateRoutes: {
    debug: true,
    routesDataFileName: 'routesData',
  }
```

When `debug` is set to true, you will get some logs, both in the server terminal and in the browser console. By default, you will get some logs for each `router.push` and `router.replace`, but not `router.prefetch`. To enable logs for `router.prefetch` too, you can set debug to `withPrefetch`.

If `routesDataFileName` is defined, to `'routesData'` for example, next-translate-routes will look in the `pages` folder for files named `routesData.json` or `routesData.yaml` instead of the default `_routes.json` or `_routes.yaml`.

If `routesTree` is defined, next-translate-routes won't parse the `pages` folder and will use the given object as the routes tree. If you uses it, beware of building correctly the routes tree to avoid bugs.

You can see and edit these while your app is running to debug things, using `__NEXT_TRANSLATE_ROUTES_DATA` in the browser console. For exemple, executing `__NEXT_TRANSLATE_ROUTES_DATA.debug = true` will activate the logs on `router.push` and `router.replace`.

#### Translate/untranslate urls

Two helpers are exposed to translate/untranslate urls:

- `fileUrlToUrl` transforms a file url into a translated url
- `urlToFileUrl` transforms a translated url into a file url

Both of them take 2 arguments: an url and a locale. `fileUrlToUrl` can take an extra option argument to prevent it to throw and return undefined instead if the file url is not found: `{ throwOnError: false }`.

#### Alternate pages (SEO)

You will probably want to indicate alternate pages for SEO optimization. Here is how you can do that:

```tsx
  const { pathname, query, locale, locale } = useRouter()

  return (
    <Head>
      {locales.map((l) => l !== locale && <link rel="alternate" hrefLang={l} href={fileUrlToUrl({ pathname, query }, l)} />)}
    </Head>
  )
```

You can do it in the `_app` component if you are sure to do that for all your pages. You can also use a dedicated package, like [next-seo](https://github.com/garmeeh/next-seo).

See [this article about alternate and canonical pages](https://hreflang.org/use-hreflang-canonical-together/)

#### Sitemap

See [@JacbSoderblom's suggestion](https://github.com/hozana/next-translate-routes/issues/21#issuecomment-1265056041)

#### Constrained dynamic paths segments

```js
// `/pages/blog/[id]/_routes.json`
{
  "/": ":id(\\d+)", // Constrain a dynamic folder segment (to be a number here)
  "[slug]": ":slug(\\w+)", // Constrain a dynamic page segment (to be letters here)
}
```

For a catch all route: `"[...path]": ":path*"`.

#### Ignoring a path part

This will ignore the `blog` path segment:

```js
// `/pages/blog/_routes.json`
{
  "/": "."
}
```

It can be done for some lang only and not others.

```js
// `/pages/blog/_routes.json`
{
  "/": {
    fr: "."
  }
}
```

⚠️ Ignoring a path segment can cause troubles with the **redirections**.

Ex: given the `/a/[b]/[c]` and `/a/[b]/[c]/d` file paths where `[b]` is ignored and the b param is merged with the c param: `:b-:c`.
`/a/:b/:c` => `/a/:b-:c` and `/a/:b/:c/d` => `/a/:b-:c/d`
Then `/a/bb/11` will be redirected to `/a/bb-11` and `/a/bb/11/d` to `/a/bb-11/d` and that is fine.
But then `/a/bb-11/d` will match `/a/:b-:c` and be redirected to `/a/bb-11-d` and that is not fine!

To handle this case, one can add a path-to-regex pattern to the default ignore token: `.(\\d+)`, or `.(\[\^-\]+)`, or `.(\what|ever\)`.
This path-to-regex pattern will be added after the segment name in the redirect.
`/a/:b(\[\^-\]+)/:c` => `/a/:b-:c` and `/a/:b(\[\^-\]+)/:c/d` => `/a/:b-:c/d`
Then `/a/bb-11/d` will no more match `/a/[b]/[c]` (`/a/:b(\[\^-\]+)/:c`). `#ignorePattern`

⚠️ This is only handled in default paths (i.e. `"/": ".(\\d+)"` or `"/": { "default": ".(\\d+)" }`), not in lang-specific paths.

#### Complex paths segments

```js
// `/pages/blog/[id]/_routes.json`
{
  "/": "article{-:id}?-view", // Add prefix, optional prefix, suffix
}
```

It is also possible to create a path segment with 2 dynamic parameters. Ex: `/articles/:id{-:slug}?`.  
First, create a path segment for each dynamic parameter: `/articles/[id]/[slug].
Then:

```js
// `/articles/[id]/_routes.json`
{
  "/": ".", // Ignore the [id] segment
  "[slug]": ":id{-:slug}?" // Give the 2 params to the 2nd segment
}
```

#### Custom route tree

If you want to avoid seeding `_routes.json` files in your `/pages` folder,
you can directly create a routesTree object, and inject it in the next config as follow.

```javascript
// next.config.js
const withTranslateRoutes = require('next-translate-routes')
const getRoutesTree = require('./getRoutesTree')

const routesTree = getRoutesTree()

module.exports = withTranslateRoutes({
  // Next i18n config (mandatory): https://nextjs.org/docs/advanced-features/i18n-routing
  i18n: {
    locales: ['en', 'fr', 'es', 'pl'],
    defaultLocale: 'pl',
  },

  translateRoutes: {
    routesTree,
  },

  // ...Remaining next config
})
```

`routesTree` must be of type `TRouteBranch`:

```typescript
type TRouteBranch<Locale extends string> = {
  name: string
  paths: { default: string } & Partial<Record<Locale, string>>
  children?: TRouteBranch[]
}
```

#### Outside Next

You might need to mock next-translate-routes outside Next, for example for testing or in [Storybook](https://storybook.js.org/).

First, you need to create next-translate-routes data. You can do it using the `createNtrData` helper, but it only works in node environment. It takes the next config as first parameter. The second parameter is optional and allows to use a custom pages folder: if omitted, `createNtrData` will look for you next `pages` folder.

```typescript
import { createNtrData } from 'next-translate-routes/plugin`
import nextConfig from '../next.config.js'

const ntrData = createNtrData(
  nextConfig,
  path.resolve(process.cwd(), './fixtures/pages'),
)
```

Then, if you want to render you app, you need to inject the router context, then (and only then) inject next-translate-routes. You can do it manually, or using `next-tranlate-routes/loader` with Webpack.

##### Manually

You will have to execute createNtrData in a node script and store the result somewhere that can be imported.

```typescript
// nextRouterMock.ts

import { RouterContext } from 'next/dist/shared/lib/router-context'
import withTranslateRoutes from 'next-translate-routes'
import ntrData from 'path/to/your/ntrData'

  //[...]

  const RouteTranslationsProvider = withTranslateRoutes(
    ntrData,
    ({ children }) => <>{children}</>,
  )

  const TranslatedRoutesProvider = ({ children }) => (
    <RouterContext.Provider value={routerMock}>
      <RouteTranslationsProvider router={routerMock}>
        {children}
      </RouteTranslationsProvider>
    </RouterContext.Provider>
  )

  // [...]
```

For Storybook, this piece of code can be used to create a decorator function:

```typescript
export const WithNextRouter: DecoratorFn = (Story, context): JSX.Element => (
  <TranslatedRoutesProvider routerMock={createRouterFromContext(context)}>
    <Story />
  </TranslatedRoutesProvider>
)
```

##### With `next-translate-routes/loader` for Webpack

`next-translate-routes/loader` allows to create next-translate-routes data at build time. So you can do exactly the same as described in the [Manually](#manually) paragraph above, but you don't need to create and add `ntrData` as an argument to `withTranslateRoutes`.

```typescript
// nextRouterMock.ts

import { RouterContext } from 'next/dist/shared/lib/router-context'
import withTranslateRoutes from 'next-translate-routes'

  //[...]

  const RouteTranslationsProvider = withTranslateRoutes(({ children }) => <>{children}</>)

  // TranslatedRoutesProvider is the same as in the manually paragraph above

  // [...]
```

Then all you have to do is to add this rule in your webpack config:

```js
// storybook/config/webpack.config.js for exemple

const { createNtrData } = require('next-translate-routes/plugin')
const nextConfig = require('../../next.config') // Your project nextConfig

module.exports = ({ config }) => {
  // [...]

  config.module.rules.push({
    test: /path\/to\/nextRouterMock/, // ⚠️ Warning! This test should only match the file where withTranslateRoutes is used! If you cannot, set the mustMatch option to false.
    use: {
      loader: 'next-translate-routes/loader',
      options: { data: createNtrData(nextConfig) },
    },
  })
  
  return config
}

```

> ⚠️ Warning! The rule `test` should only match the file where `withTranslateRoutes` is used! If you cannot, then set the `mustMatch` loader option to `false`.

### Fallback languages

You can define fallback languages in next-translate-routes config [as you would in i18next](https://www.i18next.com/principles/fallback#fallback-to-different-languages), using `fallbackLng`, that can take either a string (ex: `'fr'`), an array (ex: `['fr', 'en']`), or an object (ex: `{ default: ['en'], 'de-CH': ['fr'] }`), but unlike i18next, `fallbackLng` cannot be a function.

```javascript
// next.config.js
const withTranslateRoutes = require('next-translate-routes')

module.exports = withTranslateRoutes({
  // Next i18n config (mandatory): https://nextjs.org/docs/advanced-features/i18n-routing
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'de', 'de-AT', 'de-DE', 'de-CH'],
  },

  translateRoutes: {
    fallbackLng: {
      default: ['en'],
      'de-AT': ['de'],
      'de-DE': ['de'],
      'de-CH': ['de', 'fr'],
    },
  },

  // ...Remaining next config
})
```

It can avoid having `routes.json` files looking like:

```json
{
  "/": {
    "de": "produkt",
    "de-AT": "produkt",
    "de-DE": "produkt",
    "de-CH": "produkt",
    }
}
```

## Known issues

### Middleware with watcher (Next >=12.2.0)

Unfortunately, Next new middleware syntax (stable) has a bug when using a "matcher" and rewrites.
You can keep track of this issue:

- [in next-translate-routes repo](https://github.com/hozana/next-translate-routes/issues/19)
- [in next.js repo](https://github.com/vercel/next.js/issues/39531)

So if you want to use a middleware with Next >= 12.2.0, you need to remove any watcher option and filter from within the middleware using [conditional statements](https://nextjs.org/docs/advanced-features/middleware#conditional-statements).

### Optional catch-all with rewrites

[Another issue in Next.js](https://github.com/vercel/next.js/issues/41624) messed some optional catch all routes when they are rewritten: it has been fixed starting from 13.0.4.

### With @sentry/nextjs

@sentry/nextjs inject a webpack loader that replaces all pages content with a proxy, including _app. If it does it before next-translate-routes loader execution, the latter won't be able to do its job.

So the wrapping order in next.config.js is important!

Works:

```js
module.exports = withTranslateRoutes(withSentryConfig(nextConfig, sentryWebpackPluginOptions))
```

Does NOT work:

```js
module.exports = withSentryConfig(withTranslateRoutes(nextConfig), sentryWebpackPluginOptions)
```

## How does it work

- Next-translate-routes plugin parses the page folder and builds a routes tree object that contains the path tree and the information in the `_routes.json` files.
- The plugin then uses this information to build optimized redirects and rewrites, then add them to the next config object.
- Rewrites take care of displaying the right page for the translates urls, redirects take care of the urls that would give an unwanted access to the pages (and would create duplicated content).
- The plugin adds a webpack loader for the pages/\_app file. This loader adds a data object (containing the routes tree object along with other config) as first argument of the `withTranslateRoutes` high order component that wrap the app.
- `withTranslateRoutes` makes this data available as a global variable, `__NEXT_TRANSLATE_ROUTES_DATA`.
- The `translateUrl` function uses this data to translate routes.
- The `next-translate-routes/link` leverages the `translateUrl` function to set the `as` prop of `next/link` to the translated url so that the link is aware of the true url destination (which is then available on hover, or on right-click - copy link for example).
- The `withTranslateRoutes` enhance the router by overriding the router context, to give translation skills to the router.push (which is used on click on a `next/link`), router.replace, and router.prefetch functions, using the `translateUrl` function too.
