import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
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
  const existing = await queryOne(`SELECT * FROM jobs WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  if (body.saved !== undefined) next.saved = body.saved ? 1 : 0
  if (body.applied !== undefined) next.applied = body.applied ? 1 : 0

  await execute(`UPDATE jobs SET saved=?, applied=? WHERE id=? AND user_id=?`, [next.saved, next.applied, id, user.id])

  if (body.applied && !existing.applied) {
    logActivity(user.id, `Applied to ${existing.title} at ${existing.company}`)
  }

  const row = await queryOne(`SELECT * FROM jobs WHERE id = ? AND user_id = ?`, [id, user.id])
  return NextResponse.json(deserialize(row!))
}
