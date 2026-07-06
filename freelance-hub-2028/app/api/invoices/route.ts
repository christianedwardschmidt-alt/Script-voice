import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { client, project, amount, status, issued, due, avatar, color } = body

  const last = await queryOne<{ id: string }>(`SELECT id FROM invoices WHERE user_id = ? ORDER BY rowid DESC LIMIT 1`, [user.id])
  let nextNum = 100
  if (last?.id) {
    const m = last.id.match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  const id = `INV-${user.id}-${String(nextNum).padStart(3, '0')}`

  await execute(
    `INSERT INTO invoices (id,user_id,client,project,amount,status,issued,due,avatar,color) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, user.id, client, project ?? '', amount ?? 0, status ?? 'Draft', issued ?? '', due ?? '', avatar ?? '👤', color ?? '#16a34a']
  )
  logActivity(user.id, `Created invoice ${id} for ${client}`)
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  return NextResponse.json(row, { status: 201 })
}
