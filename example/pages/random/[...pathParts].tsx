import type { NextPage } from 'next'
import Link from '@almacareer/edu-next-translate-routes/link'
import { useRouter } from 'next/router'
import React from 'react'

import Layout from '../../components/Layout'

export const getServerSideProps = async () => ({ props: {} })

const RandomPage: NextPage = () => {
  const router = useRouter()
  const {
    pathname,
    query: { pathParts },
  } = router

  const pathPartsArray = typeof pathParts === 'string' ? [pathParts] : pathParts || []

  const nextPart = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 5)

  return (
    <Layout title="Random">
      <h1>Random</h1>
      <p>
        See <Link href="https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes">catch all route</Link>
      </p>
      <h3>Path segments list:</h3>
      <ul>
        {pathPartsArray.slice(0, -1).map((pathPart, i) => (
          <li key={pathPart + i}>
            {pathPart} -{' '}
            {<Link href={{ pathname, query: { pathParts: pathPartsArray.slice(0, i + 1) } }}>back to there</Link>}
          </li>
        ))}
      </ul>
      <p>
        Add this random segment:{' '}
        <Link href={{ pathname, query: { pathParts: [...pathPartsArray, nextPart] } }}>`/{nextPart}`</Link>
        to path.
      </p>
      <p>
        <Link href="/">Go home</Link>
      </p>
    </Layout>
  )
}

export default RandomPage
