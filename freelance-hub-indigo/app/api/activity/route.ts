import { NextRequest, NextResponse } from 'next/server'
import { db, toRows } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10)
  const res = await db.execute({ sql: `SELECT * FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT ?`, args: [user.id, limit] })
  return NextResponse.json(toRows(res.rows))
}
