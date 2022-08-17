import NextSingletonRouter from 'next/dist/client/router'

import { enhanceNextRouter } from './enhanceNextRouter'

export * from 'next/dist/client/router'

export default enhanceNextRouter(NextSingletonRouter)
