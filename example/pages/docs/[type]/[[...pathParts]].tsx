import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import Link from 'next-translate-routes/link'
import { useRouter } from 'next/router'
import React from 'react'

import Layout from '../../../components/Layout'

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps<
  { date: string; type: string; pathList: string[] },
  { type: string; pathParts: string[] }
> = ({ params }) => ({
  props: {
    date: new Date().toISOString(),
    type: params.type,
    pathList: params.pathParts?.map((pathPart) => `Part ${pathPart}`) || [],
  },
})

const DocsPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ date, type, pathList }) => {
  const {
    pathname,
    query: { pathParts },
  } = useRouter()

  const pathPartsArray = typeof pathParts === 'string' ? [pathParts] : pathParts || []
  const title = `${type.replace(/^(\w)/, (f) => f.toUpperCase())} docs`

  return (
    <Layout title={title}>
      <h1>{title}</h1>
      <p>
        This is a {type} docs page, statically generated at {new Date(date).toLocaleString()}
      </p>
      <p>
        See{' '}
        <Link href="https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes">
          optional catch all route
        </Link>
      </p>
      <h3>Path list:</h3>
      <ul>
        {pathList.map((pathListItem, i) => (
          <li key={pathListItem + i}>
            {type} - {pathListItem} -{' '}
            {<Link href={{ pathname, query: { type, pathParts: pathPartsArray.slice(0, i + 1) } }}>back to there</Link>}
          </li>
        ))}
      </ul>
      <p>
        Add one of:{' '}
        {['a', 'b', 'c'].map((p, i) => (
          <React.Fragment key={p + i}>
            {' '}
            <Link href={{ pathname, query: { type, pathParts: [...pathPartsArray, p] } }}>
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

export default DocsPage
