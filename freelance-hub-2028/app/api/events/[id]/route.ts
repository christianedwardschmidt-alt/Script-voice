import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const event = await queryOne<{ title: string }>(`SELECT title FROM calendar_events WHERE id = ? AND user_id = ?`, [id, user.id])
  await execute(`DELETE FROM calendar_events WHERE id = ? AND user_id = ?`, [id, user.id])
  if (event) logActivity(user.id, `Deleted calendar event: ${event.title}`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  await execute(
    `UPDATE calendar_events SET title=?,date=?,startTime=?,endTime=?,type=?,client=?,description=?,color=? WHERE id=? AND user_id=?`,
    [title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#5b5fcf', id, user.id]
  )
  const row = await queryOne(`SELECT * FROM calendar_events WHERE id = ?`, [id])
  return NextResponse.json(row)
}
