import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const event = await queryOne<{ title: string }>(`SELECT title FROM calendar_events WHERE id = ?`, [id])
  await execute(`DELETE FROM calendar_events WHERE id = ?`, [id])
  if (event) logActivity(`Deleted calendar event: ${event.title}`)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await request.json()
  const { title, date, startTime, endTime, type, client, description, color } = body
  await execute(
    `UPDATE calendar_events SET title=?,date=?,startTime=?,endTime=?,type=?,client=?,description=?,color=? WHERE id=?`,
    [title, date, startTime ?? null, endTime ?? null, type ?? 'meeting', client ?? null, description ?? '', color ?? '#5b5fcf', id]
  )
  const row = await queryOne(`SELECT * FROM calendar_events WHERE id = ?`, [id])
  return NextResponse.json(row)
}
