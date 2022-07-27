import Link from 'next-translate-routes/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import Layout from '../components/Layout'

const AboutPage = () => {
  const { replace: routerReplace } = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => routerReplace('/'), 5000)
    return () => clearTimeout(timeout)
  }, [routerReplace])

  return (
    <Layout title="About | next-translate-routes Example">
      <h1>About</h1>
      <p>This is the about page</p>
      <p>It will redirect to homepage using router.replace after 5 seconds.</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </Layout>
  )
}

export default AboutPage
