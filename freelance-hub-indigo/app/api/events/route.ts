import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // format: YYYY-MM
  let rows
  if (month) {
    rows = db.prepare(`SELECT * FROM calendar_events WHERE date LIKE ? ORDER BY date, startTime`).all(`${month}%`)
  } else {
    rows = db.prepare(`SELECT * FROM calendar_events ORDER BY date, startTime`).all()
  }
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  const result = db
    .prepare(`INSERT INTO calendar_events (title, date, startTime, endTime, type, client, description, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#16a34a')
  logActivity(`Added calendar event: ${title} on ${date}`)
  const row = db.prepare(`SELECT * FROM calendar_events WHERE id = ?`).get(result.lastInsertRowid)
  return NextResponse.json(row, { status: 201 })
}
