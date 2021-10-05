import React from 'react'
import { Link } from 'next-translate-routes'

import { User } from '../interfaces'

type Props = {
  data: User
}

const ListItem = ({ data }: Props) => (
  <Link href={{ pathname: '/users/u/[id]', query: { id: data.id } }}>
    <a>
      {data.id}: {data.name}
    </a>
  </Link>
)

export default ListItem
