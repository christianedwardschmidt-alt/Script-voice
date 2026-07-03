import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

export async function GET() {
  const rows = await queryAll(`SELECT * FROM invoices ORDER BY id DESC`)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { client, project, amount, status, issued, due, avatar, color } = body

  const last = await queryOne<{ id: string }>(`SELECT id FROM invoices ORDER BY id DESC LIMIT 1`)
  let nextNum = 92
  if (last?.id) {
    const m = last.id.match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  const id = `INV-${String(nextNum).padStart(3, '0')}`

  await execute(
    `INSERT INTO invoices (id,client,project,amount,status,issued,due,avatar,color) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, client, project ?? '', amount ?? 0, status ?? 'Draft', issued ?? '', due ?? '', avatar ?? '👤', color ?? '#16a34a']
  )
  logActivity(`Created invoice ${id} for ${client}`)
  const row = await queryOne(`SELECT * FROM invoices WHERE id = ?`, [id])
  return NextResponse.json(row, { status: 201 })
}
