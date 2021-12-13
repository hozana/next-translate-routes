import React from 'react'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import withTranslateRoutes, { translateUrl } from 'next-translate-routes'

const App: React.FC<AppProps> = ({ Component, pageProps, router: baseRouter }) => {
  const clientRouter = useRouter()

  if (typeof window !== 'undefined') {
    console.log('From _app.', {
      translateUrl,
      routesTree: JSON.parse(process.env.NEXT_PUBLIC_ROUTES),
      baseRouter,
      clientRouter,
    })
  }

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
