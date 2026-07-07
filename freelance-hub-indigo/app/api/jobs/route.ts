import { NextResponse } from 'next/server'
import { db, toRows } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    saved: !!row.saved,
    applied: !!row.applied,
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM jobs WHERE user_id = ? ORDER BY id DESC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows).map(deserialize))
}
