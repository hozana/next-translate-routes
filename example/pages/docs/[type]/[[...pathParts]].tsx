import React from 'react'
import Link from 'next-translate-routes/link'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'

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

  return (
    <Layout title="Docs">
      <h1>Docs</h1>
      <p>This is the docs page, statically generated at {new Date(date).toLocaleString()}</p>
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

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export default DocsPage
