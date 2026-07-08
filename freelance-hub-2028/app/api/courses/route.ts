import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const rows = await queryAll(`SELECT * FROM courses WHERE user_id = ? ORDER BY id ASC`, [user.id])
  return NextResponse.json(rows.map(deserialize))
}
