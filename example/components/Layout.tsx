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
      <LinkComponent href="/">Home</LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname: '/about-us' }}>About</LinkComponent>
      {' | '}
      <LinkComponent href="/news">News</LinkComponent>
      {' | '}
      <LinkComponent href="/rewrites">Rewrites</LinkComponent>
      {' | '}
      <LinkComponent href="/docs/api">Api docs</LinkComponent>
      {' - '}
      <LinkComponent href={{ pathname: '/docs/[type]/[[...pathParts]]', query: { type: 'client' } }}>
        Client docs
      </LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname: '/users' }}>Users List</LinkComponent>
      {' | '}
      <LinkComponent href="/random/path">Random</LinkComponent>
      {' | '}
      <LinkComponent href="https://hozana.org/en">External link</LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname, query, hash: 'footer' }}>Hash link</LinkComponent>
      {' | '}
      <LinkComponent href={{ pathname, query }} locale={newLocale}>
        {newLocale}
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
      <footer id="footer">
        <hr />
        <blockquote>{`locale: ${locale}, pathname: ${pathname}, query: ${JSON.stringify(query)}`}</blockquote>
      </footer>
    </div>
  )
}

export default Layout
