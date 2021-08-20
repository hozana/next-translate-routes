# Next-translate-routes

_Back to Next file-base routing system while remaining free from its limits_

## Features

- __Translated paths segments__  
  Ex: `/contact-us` and `/fr/contactez-nous`.
- __Complex paths segments__ (path-to-regexp synthax)  
  Ex: `/:id{-:slug}?/`
- __Constrained dynamic paths segments__ (path-to-regexp synthax)  
  Ex: `/:id(\\d+)/`
- __No duplicated content (SEO)__  
  Simple rewrites would make a page accessible with 2 different urls which is bad for SEO.
- __Auto-redirection to correct translated path__  
  Ex: `/fr/english/path` redirects to `/fr/french/path`
- __No custom server needed!__  
  Next automatic static optimization remains available.

## Motivation

To build a fully internationalized website, one need to translate url segments: it is important for UX and SEO.
For now, Next only ship with locale prefixes ([see Next.js internationalized routing doc](https://nextjs.org/docs/advanced-features/i18n-routing)).

The [next-routes](https://github.com/fridays/next-routes) package allow fully internationalized routing but it is no longer maintained, and it is designed without the latest Next api, such as internationalized routing, new data fetching methods, automatic static optimization.  
To be able to use theses, a new approach is needed. Next.js provides it with [Redirects](https://nextjs.org/docs/api-reference/next.config.js/redirects) and [Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites), but:

- the main problem is that writing the rewrites and redirects to translate all the routes by hand is long, boring, error-prone, and hard to maintain.
- an other problem is that by default, the file path works with all the locale prefixes: it creates 2 urls for the same content, which is not good for SEO. This problem can be worked around by creating redirects from `/${localePrefix}/$(filePath)` to `/${localePrefix}/$(localePath)`, but it creates a lot more complexity to write by hand and maintain.

## How to

### Basic usage

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

You can add a `routes.json` file in the `pages` folder, and in the every subfolder where you want to define routes, with the following:  
```js
// `/pages/section/routes.json`
{
  "/": {
    "es": "seccion" // Folder path in es
  },
  "page1": {
    "default": "article", // Overwrite the default page path (fallback)
    "es": "articulo"
  },
  "page2": "definition", // Overwrite the page path for all language
}
```  
The "/" section define the folder paths, each other section define the paths of a page file in this folder.

#### 3. Use the next-translate-routes Link, useRouter, and withRouter

next-translate-routes extends Next Link, useRouter, withRouter, to translate routes automatically: import them from 'next-translate-route' instead of 'next/link' and 'next/router', and use them as you ever did.

```jsx
import React, { useEffect, useState } from 'react'

import { Link, useRouter, withRouter } from 'next-translate-routes'

const MyLinks = () => {
  const { locales } = useRouter()

  return (
    <>
      <Link href={{ pathname: '/file/path/to/page'}}>Current locale</Link>
      {locale.map((locale) => (
        <Link href={{ pathname: '/file/path/to/page'}} locale={locale} key={locale}>{locale}</Link>
      )}
    </>
  )
}

const ComponentWithUseRouter = ({ lang }) => {
  const router = useRouter()

  useEffect(() => {
    if (router.locale !== lang) {
      router.push({ pathname: '/' }, { locale: lang })
    }
  })

  return <MyLinks />
}

const ComponentWithWithRouter = withRouter(({ lang, router }) => {
  const [, setPrefetched] = useState(false)
  useEffect(() => {
    setPrefetched((previousPrefetched) => {
      router.prefetch({ pathname: '/page/to/prefetch' }, { locale: lang })
    })
  }, [lang, router])

  return <MyLinks />
})


```

### Constrained dynamic paths segments

```js
// `/pages/blog/[id]/routes.json`
{
  "/": ":id(\\d+)", // Constrain a dynamic folder segment (to be a number here)
  "[slug]": ":slug(\\w+)", // Constrain a dynamic page segment (to be letters here)
}
```
For a catch all route: `"[...path]": ":path*"`.

### Ignoring a path part

This will ignore the `blog` path segment:
```js
// `/pages/blog/routes.json`
{
  "/": "."
}
```

### Complex paths segments

```js
// `/pages/blog/[id]/routes.json`
{
  "/": "article{-:id}?-view", // Add prefix, optional prefix, suffix
}
```

It is also possible to create a path segment with 2 dynamic parameters. Ex: `/articles/:id{-:slug}?`.  
First, create a path segment for each dynamic parameter: `/articles/[id]/[slug].
Then:
```js
// `/articles/[id]/routes.json`
{
  "/": ".", // Ignore the [id] segment
  "[slug]": ":id{-:slug}?" // Give the 2 params to the 2nd segment
}
```

### Custom route tree

If you want to avoid seeding `routes.json` files in your `/pages` folder,
you can directly create a routesTree object, and inject it in the next config as stringified JSON.

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

  env: {
    NEXT_PUBLIC_ROUTES: routesTree,
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

### Warning

The router prop received by the App and Pages components is a bare Next router: if you want to use next-translate-routes router, you need to inject it with useRouter or withRouter.
