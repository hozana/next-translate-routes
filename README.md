# Next-translate-routes

_Back to Next file-base routing system while remaining free from its limits_

## Features

- __Complex paths segments__ (path-to-regexp synthax)  
  Ex: `/:id{-:slug}?/`
- __Constrained dynamic paths segments__ (path-to-regexp synthax)  
  Ex: `/:id(\\d+)/`
- __No duplicated content (SEO)__  
  Simple rewrites would make a page accessible with 2 different urls which is bad for SEO.
- __Auto-redirection to correct locale__  
  Ex: `/fr/english/path` redirects to `/en/english/path`
- __Enhanced Link component to accept a lang prop__
- __No custom server needed!__  
  Next automatic static optimization remains available.

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

In the `pages` folder, and in each of its subfolders, add a `routes.json` file with the following:  
```json  
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

#### 3. Use the next-translate-routes utils

next-translate-routes extends Next Link, useRouter, withRouter, to translate routes automatically.

```jsx
import React, { useEffect, useState } from 'react'

import { Link, useRouter, withRouter } from 'next-translate-routes'

const MyLinks = () => {
  const { locales } = useRouter()

  return locale.map((locale) => (
    <>
      <Link href={{ pathname: '/file/path/to/page', locale }} />
      <Link href={{ pathname: '/file/path/with/dynamic/[param]', query: { param: 'paramValue' }, locale }} />
      <Link href={{ pathname: '/file/path/with/optional/catch/all/[[...route]]', locale }} />
    <>
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

```json
// `/pages/blog/[id]/routes.json`
{
  "/": ":id(\\d+)", // Constrain a dynamic folder segment (to be a number here)
  "[slug]": ":slug(\\w+)", // Constrain a dynamic page segment (to be letters here)
}
```
For a catch all route: `"[...path]": ":path*"`.

### Ignoring a path part

This will ignore the `blog` path segment:
```json
// `/pages/blog/routes.json`
{
  "/": "."
}
```

### Complex paths segments

```json
// `/pages/blog/[id]/routes.json`
{
  "/": "article{-:id}?-view", // Add prefix, optional prefix, suffix
}
```

It is also possible to create a path segment with 2 dynamic parameters. Ex: `/articles/:id{-:slug}?`.  
First, create a path segment for each dynamic parameter: `/articles/[id]/[slug].
Then:
```json
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
