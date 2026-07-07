import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRows, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  const res = month
    ? await db.execute({ sql: `SELECT * FROM calendar_events WHERE user_id = ? AND date LIKE ? ORDER BY date, startTime`, args: [user.id, `${month}%`] })
    : await db.execute({ sql: `SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date, startTime`, args: [user.id] })

  return NextResponse.json(toRows(res.rows))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body

  const res = await db.execute({
    sql: `INSERT INTO calendar_events (user_id, title, date, startTime, endTime, type, client, description, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [user.id, title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#16a34a'],
  })

  await logActivity(user.id, `Added calendar event: ${title} on ${date}`)
  const row = await db.execute({ sql: `SELECT * FROM calendar_events WHERE id = ?`, args: [Number(res.lastInsertRowid!)] })
  return NextResponse.json(toRow(row.rows[0]), { status: 201 })
}
