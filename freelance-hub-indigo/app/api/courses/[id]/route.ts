import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM courses WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next = toRow(existing.rows[0])
  if (body.enrolled !== undefined) next.enrolled = body.enrolled ? 1 : 0
  if (body.progress !== undefined) next.progress = body.progress

  await db.execute({ sql: `UPDATE courses SET enrolled=?, progress=? WHERE id=? AND user_id=?`, args: [next.enrolled, next.progress, id, user.id] })

  if (body.enrolled && !existing.rows[0].enrolled) {
    await logActivity(user.id, `Enrolled in course: ${existing.rows[0].title}`)
  }

  const row = await db.execute({ sql: `SELECT * FROM courses WHERE id = ?`, args: [id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}
