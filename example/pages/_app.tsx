import React, { useEffect } from 'react'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import withTranslateRoutes, { translateUrl } from 'next-translate-routes'

const App: React.FC<AppProps> = ({ Component, pageProps, router: baseRouter }) => {
  const router = useRouter()

  useEffect(
    () =>
      console.log('From _app.', {
        translateUrl,
        routesTree: JSON.parse(process.env.NEXT_PUBLIC_ROUTES),
        baseRouter,
      }),
    [baseRouter],
  )

  useEffect(() => console.log('From _app. useRouter router:', router), [router])

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
