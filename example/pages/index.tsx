import React from 'react'
import Layout from '../components/Layout'
import { Link } from '../components/Link'

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
      <Link href="/docs">
        <a>Docs</a>
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
