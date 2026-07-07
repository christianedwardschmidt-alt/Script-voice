import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password']
const PUBLIC_API = ['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password', '/api/auth/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API.some(p => pathname.startsWith(p))) return NextResponse.next()
    return NextResponse.next()
  }

  const session = request.cookies.get('gw_session')

  if (AUTH_PATHS.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
