import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    saved: !!row.saved,
    applied: !!row.applied,
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM jobs WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  if (body.saved !== undefined) next.saved = body.saved ? 1 : 0
  if (body.applied !== undefined) next.applied = body.applied ? 1 : 0

  await db.execute({ sql: `UPDATE jobs SET saved=?, applied=? WHERE id=? AND user_id=?`, args: [next.saved, next.applied, id, user.id] })

  if (body.applied && !existing.rows[0].applied) {
    await logActivity(user.id, `Applied to ${existing.rows[0].title} at ${existing.rows[0].company}`)
  }

  const row = await db.execute({ sql: `SELECT * FROM jobs WHERE id = ?`, args: [id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}
