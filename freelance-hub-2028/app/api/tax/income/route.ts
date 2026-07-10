import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_income WHERE user_id = ? ORDER BY date_received DESC, id DESC`, [user.id])
  return NextResponse.json(rows)
}
