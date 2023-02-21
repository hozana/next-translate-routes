import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import Link from 'next-translate-routes/link'
import React from 'react'

import Layout from '../../components/Layout'
import List from '../../components/List'
import { User } from '../../interfaces'
import { sampleUserData } from '../../utils/sample-data'

export const getStaticProps: GetStaticProps<{ items: User[] }> = async () => {
  return { props: { items: sampleUserData } }
}

const UsersPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items }) => (
  <Layout title="Users List | Next.js + TypeScript Example">
    <h1>Users List</h1>
    <p>
      Example fetching data from inside <code>getStaticProps()</code>.
    </p>
    <p>You are currently on: /users</p>
    <List items={items} />
    <p>
      <Link href="/">Go home</Link>
    </p>
  </Layout>
)

export default UsersPage
