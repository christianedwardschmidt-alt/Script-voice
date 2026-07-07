import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT title FROM calendar_events WHERE id = ? AND user_id = ?`, args: [Number(id), user.id] })
  await db.execute({ sql: `DELETE FROM calendar_events WHERE id = ? AND user_id = ?`, args: [Number(id), user.id] })
  if (existing.rows[0]) await logActivity(user.id, `Deleted calendar event: ${existing.rows[0].title}`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body

  await db.execute({
    sql: `UPDATE calendar_events SET title=?, date=?, startTime=?, endTime=?, type=?, client=?, description=?, color=? WHERE id=? AND user_id=?`,
    args: [title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#16a34a', Number(id), user.id],
  })

  const row = await db.execute({ sql: `SELECT * FROM calendar_events WHERE id = ?`, args: [Number(id)] })
  return NextResponse.json(toRow(row.rows[0]))
}
