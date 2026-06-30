import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  if (body.enrolled !== undefined) next.enrolled = body.enrolled ? 1 : 0
  if (body.progress !== undefined) next.progress = body.progress

  db.prepare(`UPDATE courses SET enrolled=?, progress=? WHERE id=?`).run(next.enrolled, next.progress, id)

  if (body.enrolled && !existing.enrolled) {
    logActivity(`Enrolled in course: ${existing.title}`)
  }

  const row = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(id) as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}
