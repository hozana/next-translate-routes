import React from 'react'
import { NextPage } from 'next'
import Error, { ErrorProps } from 'next/error'
import Layout from '../components/Layout'

const ErrorPage: NextPage<ErrorProps> = ({ statusCode, title }) => (
  <Layout title={`Error | ${statusCode} | ${title}`}>
    <Error statusCode={statusCode} title={title} />
  </Layout>
)

export default ErrorPage
