import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import type { InValue } from '@libsql/client'

type Params = { params: Promise<{ id: string }> }

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    pinned: !!row.pinned,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const rows = await queryAll(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>))
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const updates: string[] = []
  const args: InValue[] = []

  if ('title' in body) { updates.push('title = ?'); args.push(body.title as string) }
  if ('content' in body) { updates.push('content = ?'); args.push(body.content as string) }
  if ('pinned' in body) { updates.push('pinned = ?'); args.push(body.pinned ? 1 : 0) }
  if ('linked_client' in body) { updates.push('linked_client = ?'); args.push(body.linked_client as string) }
  if ('tags' in body) { updates.push('tags = ?'); args.push(JSON.stringify(body.tags)) }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(Number(id))
  args.push(user.id)

  if (updates.length > 1) {
    await execute(`UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, args)
  }

  const rows = await queryAll(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>))
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [Number(id), user.id])
  return NextResponse.json({ ok: true })
}
