import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth']
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const DEMO_ALLOW = new Set(['/api/auth/logout', '/api/auth/demo'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block mutations for demo mode
  if (
    request.cookies.get('gw_demo')?.value === '1' &&
    pathname.startsWith('/api/') &&
    !SAFE_METHODS.has(request.method) &&
    !DEMO_ALLOW.has(pathname)
  ) {
    return NextResponse.json(
      { error: 'Demo mode is read-only. Sign up for a free account to make changes.' },
      { status: 403 }
    )
  }

  const isPublic = pathname === '/' ||
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) return NextResponse.next()

  const session = request.cookies.get('gw_session')?.value
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
