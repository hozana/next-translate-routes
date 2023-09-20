import Link from 'next-translate-routes/link'
import React from 'react'

import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    <h1>Hello Next.js 👋</h1>
    <p>
      <Link href="/about">About</Link>
    </p>
    <p>
      <Link href="/rewrites">Rewrites</Link>
    </p>
    <p>
      <Link href="/news">News</Link>
    </p>
    <p>
      <Link href="/docs/server">Server docs</Link>
      {' - '}
      <Link href="/docs/client">Client docs</Link>
    </p>
    <p>
      <Link href="/users">Users List</Link>
    </p>
  </Layout>
)

export default IndexPage
