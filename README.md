# Next-translate-routes

_Translated routing and more for Next using Next regular file-base routing system_

## Features

- **Translated paths segments**  
  Ex: `/contact-us` and `/fr/contactez-nous`.
- **Complex paths segments** (path-to-regexp synthax)  
  Ex: `/:id{-:slug}?/`
- **Constrained dynamic paths segments** (path-to-regexp synthax)  
  Ex: `/:id(\\d+)/`
- **No duplicated content (SEO)**  
  Simple rewrites would make a page accessible with 2 different urls which is bad for SEO.
- **Auto-redirection to correct translated path**  
  Ex: `/fr/english/path` redirects to `/fr/french/path`
- **No custom server needed!**  
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

You can add a `_routes.json` file in the `pages` folder, and in the every subfolder where you want to define routes, with the following:

```js
// `/pages/section/_routes.json`
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

The `"/"` section define the folder paths, each other section define the paths of a page file in this folder.

#### 3. Wrap you \_app component with the withTranslateRoutes hoc

```js
// `/pages/_app.js`
import { App } from 'next/app'
import { withTranslateRoutes } from 'next-translate-routes'

export default withTranslateRoutes(App)
```

Or:

```js
// `/pages/_app.js`
import { withTranslateRoutes } from 'next-translate-routes'

const App = ({ Component, pageProps, router }) => {
  // Custom code...

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
```

#### 4. Use the next-translate-routes Link

next-translate-routes extends Next Link to translate routes automatically: import it from 'next-translate-routes' instead of 'next/link' and use as you ever did.

```jsx
import React, { useEffect, useState } from 'react'

import { Link } from 'next-translate-routes'

const MyLinks = (props) => {
  const { locales } = useRouter()

  return (
    <>
      <Link href="/file/path/to/page">Current locale</Link>
      {locale.map((locale) => (
        <Link
          href={{ pathname: '/file/path/to/[dynamic]/page', query: { dynamic: props.param, otherQueryParam: 'foo' } }}
          locale={locale}
          key={locale}
        >
          {locale}
        </Link>
      )}
    </>
  )
}

```

### Constrained dynamic paths segments

```js
// `/pages/blog/[id]/_routes.json`
{
  "/": ":id(\\d+)", // Constrain a dynamic folder segment (to be a number here)
  "[slug]": ":slug(\\w+)", // Constrain a dynamic page segment (to be letters here)
}
```

For a catch all route: `"[...path]": ":path*"`.

### Ignoring a path part

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

/!\ Ignoring a path segment can cause troubles.  
Ex. Given the /a/[b]/[c] and /a/[b]/[c]/d file paths. [b] is ignored and the b param is merged with the c param: ":b-:c".  
Then /a/b/c will be redirected to /a/b-c and that is fine.  
But /a/b-c/d will be redirected to /a/b-c-d and that is not fine.

To handle this case, one can add a path-to-regex pattern to the default ignore token. Ex: '.(\\\\d+)', or '.(\\[\\^-\\]+)'.  
This path-to-regex pattern will be added after the segment name in the redirect.  
Then /a/b(\\d+)/c will be redirected to /a/b-c, and /a/b-c/d will not be redirected to /a/b-c-d.  
/!\ This is only handled in default paths (i.e. "/": ".(\\\\d+)" or "/": { "default": ".(\\\\d+)" }), not in lang-specific paths.

### Complex paths segments

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

### Custom route tree

If you want to avoid seeding `_routes.json` files in your `/pages` folder,
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
