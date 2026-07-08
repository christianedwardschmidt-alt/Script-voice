import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM tax_w9 WHERE user_id = ?`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { client_name, status } = body
  const existing = await queryAll(`SELECT id FROM tax_w9 WHERE user_id = ? AND client_name = ?`, [user.id, client_name])
  if (existing.length > 0) {
    const row = existing[0] as { id: number }
    await execute(`UPDATE tax_w9 SET status = ? WHERE id = ? AND user_id = ?`, [status, row.id, user.id])
  } else {
    await execute(`INSERT INTO tax_w9 (user_id, client_name, status) VALUES (?, ?, ?)`, [user.id, client_name, status])
  }
  logActivity(user.id, `W-9 status for ${client_name}: ${status}`)
  return NextResponse.json({ ok: true })
}
