import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const rows = month
    ? await queryAll(`SELECT * FROM calendar_events WHERE user_id = ? AND date LIKE ? ORDER BY date, startTime`, [user.id, `${month}%`])
    : await queryAll(`SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date, startTime`, [user.id])
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  const result = await execute(
    `INSERT INTO calendar_events (user_id,title,date,startTime,endTime,type,client,description,color) VALUES (?,?,?,?,?,?,?,?,?)`,
    [user.id, title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#5b5fcf']
  )
  logActivity(user.id, `Added calendar event: ${title} on ${date}`)
  const row = await queryOne(`SELECT * FROM calendar_events WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
