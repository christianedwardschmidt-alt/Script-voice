import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM courses WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  if (body.enrolled !== undefined) next.enrolled = body.enrolled ? 1 : 0
  if (body.progress !== undefined) next.progress = body.progress

  await execute(`UPDATE courses SET enrolled=?, progress=? WHERE id=?`, [next.enrolled, next.progress, id])

  if (body.enrolled && !existing.enrolled) {
    logActivity(`Enrolled in course: ${existing.title}`)
  }

  const row = await queryOne(`SELECT * FROM courses WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}
