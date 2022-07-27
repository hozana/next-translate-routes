import { InferGetServerSidePropsType, NextPage } from 'next'
import Link from 'next-translate-routes/link'
import React from 'react'

import Layout from '../components/Layout'

export const getServerSideProps = () =>
  Promise.resolve({
    props: {
      news: [
        {
          id: 1,
          date: new Date().toISOString(),
          content: 'Server side rendered using getServerSideProps',
        },
      ],
    },
  })

const NewsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ news }) => (
  <Layout title="News | next-translate-routes Example">
    <h1>News</h1>
    {news.map(({ id, date, content }) => (
      <p key={id}>
        {new Date(date).toLocaleString()} - {content}
      </p>
    ))}
    <p>
      <Link href="/">
        <a>Go home</a>
      </Link>
    </p>
  </Layout>
)

export default NewsPage
