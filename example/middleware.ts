import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Hi from middleware! request:', {
    nextUrl: request.nextUrl,
    url: request.url,
  })
  return NextResponse.next()
}

export const config = {
  matcher: ['/users/:path*'],
}
