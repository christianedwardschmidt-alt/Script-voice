import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = db.prepare(`SELECT title FROM calendar_events WHERE id = ?`).get(Number(params.id)) as { title: string } | undefined
  db.prepare(`DELETE FROM calendar_events WHERE id = ?`).run(Number(params.id))
  if (event) logActivity(`Deleted calendar event: ${event.title}`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  db.prepare(`UPDATE calendar_events SET title=?, date=?, startTime=?, endTime=?, type=?, client=?, description=?, color=? WHERE id=?`)
    .run(title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#5b5fcf', Number(params.id))
  const row = db.prepare(`SELECT * FROM calendar_events WHERE id = ?`).get(Number(params.id))
  return NextResponse.json(row)
}
