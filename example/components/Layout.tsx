import Link from 'next-translate-routes/link'
import Head from 'next/head'
import NextLink, { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  title?: string
}

const Nav: React.FC<{ LinkComponent: React.ComponentType<React.PropsWithChildren<LinkProps>> }> = ({
  LinkComponent,
}) => {
  const { locale, pathname, query } = useRouter()
  const newLocale = locale === 'en' ? 'fr' : 'en'

  return (
    <nav>
      <LinkComponent href="/">
        <a>Home</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href="/about">
        <a>About</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href="/news">
        <a>News</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href="/rewrites">
        <a>Rewrites</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname: '/docs/[type]/[[...pathParts]]', query: { type: 'api' } }}>
        <a>Api docs</a>
      </LinkComponent>
      {' - '}
      <LinkComponent href={{ pathname: '/docs/[type]/[[...pathParts]]', query: { type: 'client' } }}>
        <a>Client docs</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname: '/users' }}>
        <a>Users List</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname: '/random/[...pathParts]', query: { pathParts: ['path'] } }}>
        <a>Random</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href="https://hozana.org/en">
        <a>External link</a>
      </LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname, query }} locale={newLocale}>
        <a>{newLocale}</a>
      </LinkComponent>
    </nav>
  )
}

const Layout = ({ children, title = 'This is the default title' }: Props) => {
  const { locale, pathname, query } = useRouter()
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <header>
        <h3>With next-translate-routes/link</h3>
        <Nav LinkComponent={Link} />
        <h3>With next/link</h3>
        <Nav LinkComponent={NextLink} />
      </header>
      {children}
      <footer>
        <hr />
        <blockquote>{`locale: ${locale}, pathname: ${pathname}, query: ${JSON.stringify(query)}`}</blockquote>
      </footer>
    </div>
  )
}

export default Layout
