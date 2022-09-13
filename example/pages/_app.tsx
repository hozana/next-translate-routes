import withTranslateRoutes, { translateUrl, urlToFileUrl, fileUrlToUrl } from 'next-translate-routes'
import singletonRouter from 'next-translate-routes/router'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import * as pathToRegexp from 'path-to-regexp'
import React, { useEffect } from 'react'

const App: React.FC<AppProps> = ({ Component, pageProps, router: baseRouter }) => {
  const router = useRouter()

  useEffect(
    () => console.log('From _app.', { translateUrl, urlToFileUrl, fileUrlToUrl, baseRouter, singletonRouter }),
    [baseRouter],
  )

  useEffect(() => console.log('From _app. useRouter router:', router), [router])

  useEffect(() => console.log('From _app. pathToRegexp:', pathToRegexp), [])

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
