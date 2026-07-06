import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll(`SELECT * FROM clients WHERE user_id = ? ORDER BY id DESC`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { name, company, email, phone, website, avatar, color, status, revenue, projects } = body
  const result = await execute(
    `INSERT INTO clients (user_id,name,company,email,phone,website,avatar,color,status,revenue,projects) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [user.id, name, company, email ?? null, phone ?? null, website ?? null, avatar ?? '👤', color ?? '#16a34a', status ?? 'active', revenue ?? 0, projects ?? 0]
  )
  logActivity(user.id, `Added new client: ${name}`)
  const row = await queryOne(`SELECT * FROM clients WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
