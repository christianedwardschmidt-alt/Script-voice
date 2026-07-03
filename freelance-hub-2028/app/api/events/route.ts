import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const rows = month
    ? await queryAll(`SELECT * FROM calendar_events WHERE date LIKE ? ORDER BY date, startTime`, [`${month}%`])
    : await queryAll(`SELECT * FROM calendar_events ORDER BY date, startTime`)
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  const result = await execute(
    `INSERT INTO calendar_events (title,date,startTime,endTime,type,client,description,color) VALUES (?,?,?,?,?,?,?,?)`,
    [title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#5b5fcf']
  )
  logActivity(`Added calendar event: ${title} on ${date}`)
  const row = await queryOne(`SELECT * FROM calendar_events WHERE id = ?`, [result.lastInsertRowid])
  return NextResponse.json(row, { status: 201 })
}
