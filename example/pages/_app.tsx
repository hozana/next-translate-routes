import withTranslateRoutes, { translateUrl } from 'next-translate-routes'
import singletonRouter from 'next-translate-routes/router'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const App: React.FC<AppProps> = ({ Component, pageProps, router: baseRouter }) => {
  const router = useRouter()

  useEffect(() => console.log('From _app.', { translateUrl, baseRouter, singletonRouter }), [baseRouter])

  useEffect(() => console.log('From _app. useRouter router:', router), [router])

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
