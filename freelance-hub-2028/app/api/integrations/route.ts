import { NextResponse } from 'next/server'
import { queryAll, ensureUserCatalog } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  await ensureUserCatalog(user.id)
  const rows = await queryAll(`SELECT * FROM integrations WHERE user_id = ? ORDER BY rowid ASC`, [user.id])
  return NextResponse.json(rows.map(deserialize))
}
