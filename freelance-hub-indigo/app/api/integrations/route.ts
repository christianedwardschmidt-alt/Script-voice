import { NextResponse } from 'next/server'
import { db, toRows } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await db.execute({ sql: `SELECT * FROM integrations WHERE user_id = ? ORDER BY rowid ASC`, args: [user.id] })
  return NextResponse.json(toRows(res.rows).map(deserialize))
}
