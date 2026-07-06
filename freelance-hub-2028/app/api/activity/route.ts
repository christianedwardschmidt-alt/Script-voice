import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10)
  const rows = await queryAll(`SELECT * FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT ?`, [user.id, limit])
  return NextResponse.json(rows)
}
