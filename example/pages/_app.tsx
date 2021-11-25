import React from 'react'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import withTranslateRoutes from 'next-translate-routes'

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter()

  if (typeof window !== 'undefined') {
    console.log('From _app.', { routesTree: JSON.parse(process.env.NEXT_PUBLIC_ROUTES), router })
  }

  return <Component {...pageProps} />
}

export default withTranslateRoutes(App)
