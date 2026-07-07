import { NextResponse } from 'next/server'
import { queryAll, ensureUserCatalog } from '@/lib/db'
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
  if (!user) return NextResponse.json([], { status: 401 })

  await ensureUserCatalog(user.id)
  const rows = await queryAll(`SELECT * FROM jobs WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows.map(deserialize))
}
