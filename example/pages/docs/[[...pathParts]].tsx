import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

const AboutPage = () => {
  const {
    pathname,
    query: { pathParts },
  } = useRouter()

  return (
    <Layout title="Docs">
      <h1>Docs</h1>
      <p>This is the docs page</p>
      <h3>Path parts:</h3>
      <ul>
        {(pathParts as string[])?.map((pathPart, i) => (
          <li key={pathPart + i}>{pathPart}</li>
        ))}
      </ul>
      <p>
        Add one of:{' '}
        {['a', 'b', 'c'].map((p, i) => (
          <React.Fragment key={p + i}>
            {' '}
            <Link href={{ pathname, query: { pathParts: [...((pathParts || []) as string[]), p] } }}>
              <a>`/{p}`</a>
            </Link>
            {', '}
          </React.Fragment>
        ))}
        to path.
      </p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </Layout>
  )
}

export default AboutPage
