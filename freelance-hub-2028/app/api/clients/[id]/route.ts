import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await queryOne(`SELECT * FROM clients WHERE id = ?`, [id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM clients WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const next: Record<string, unknown> = { ...existing }
  for (const f of ['name','company','email','phone','website','avatar','color','status','revenue','projects']) {
    if (body[f] !== undefined) next[f] = body[f]
  }

  await execute(
    `UPDATE clients SET name=?,company=?,email=?,phone=?,website=?,avatar=?,color=?,status=?,revenue=?,projects=? WHERE id=?`,
    [next.name, next.company, next.email, next.phone, next.website, next.avatar, next.color, next.status, next.revenue, next.projects, id]
  )
  const row = await queryOne(`SELECT * FROM clients WHERE id = ?`, [id])
  return NextResponse.json(row)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne<{ name: string }>(`SELECT name FROM clients WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM clients WHERE id = ?`, [id])
  logActivity(`Removed client: ${existing.name}`)
  return NextResponse.json({ success: true })
}
