import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    saved: !!row.saved,
    applied: !!row.applied,
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM jobs WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  if (body.saved !== undefined) next.saved = body.saved ? 1 : 0
  if (body.applied !== undefined) next.applied = body.applied ? 1 : 0

  await execute(`UPDATE jobs SET saved=?, applied=? WHERE id=?`, [next.saved, next.applied, id])

  if (body.applied && !existing.applied) {
    logActivity(`Applied to ${existing.title} at ${existing.company}`)
  }

  const row = await queryOne(`SELECT * FROM jobs WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}
