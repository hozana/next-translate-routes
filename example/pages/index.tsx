import React from 'react'
import Link from 'next-translate-routes/link'

import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    <h1>Hello Next.js 👋</h1>
    <p>
      <Link href="/about">
        <a>About</a>
      </Link>
    </p>
    <p>
      <Link href="/rewrites">
        <a>Rewrites</a>
      </Link>
    </p>
    <p>
      <Link href="/news">
        <a>News</a>
      </Link>
    </p>
    <p>
      <Link href="/docs/api">
        <a>Api docs</a>
      </Link>
      {' - '}
      <Link href="/docs/client">
        <a>Client docs</a>
      </Link>
    </p>
    <p>
      <Link href="/users">
        <a>Users List</a>
      </Link>
    </p>
  </Layout>
)

export default IndexPage
