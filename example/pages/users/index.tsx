import React from 'react'
import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import Link from 'next-translate-routes/link'

import { User } from '../../interfaces'
import { sampleUserData } from '../../utils/sample-data'
import Layout from '../../components/Layout'
import List from '../../components/List'

export const getStaticProps: GetStaticProps<{ items: User[] }> = async () => ({ props: { items: sampleUserData } })

const UsersPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items }) => (
  <Layout title="Users List | Next.js + TypeScript Example">
    <h1>Users List</h1>
    <p>
      Example fetching data from inside <code>getStaticProps()</code>.
    </p>
    <p>You are currently on: /users</p>
    <List items={items} />
    <p>
      <Link href="/">
        <a>Go home</a>
      </Link>
    </p>
  </Layout>
)

export default UsersPage
