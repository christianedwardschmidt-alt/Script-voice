import { NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getUser, SESSION_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await execute(`DELETE FROM sessions WHERE token = ?`, [token]).catch(() => {})
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  res.cookies.set('gw_demo', '', { maxAge: 0, path: '/' })
  return res
}
