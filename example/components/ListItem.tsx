import Link from 'next-translate-routes/link'
import React from 'react'

import { User } from '../interfaces'

type Props = {
  data: User
}

const ListItem = ({ data }: Props) => (
  <Link href={`/users/u/${data.id}`}>
    {data.id}: {data.name}
  </Link>
)

export default ListItem
