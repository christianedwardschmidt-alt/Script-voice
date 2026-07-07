import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token)
    }
  } catch { /* ignore */ }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
