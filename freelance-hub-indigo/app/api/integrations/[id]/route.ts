import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity, toRow } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT * FROM integrations WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const connected = body.connected ? 1 : 0
  const lastSync = connected ? 'just now' : null

  await db.execute({ sql: `UPDATE integrations SET connected=?, lastSync=? WHERE id=? AND user_id=?`, args: [connected, lastSync, id, user.id] })
  await logActivity(user.id, connected ? `Connected ${existing.rows[0].name}` : `Disconnected ${existing.rows[0].name}`)

  const row = await db.execute({ sql: `SELECT * FROM integrations WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  return NextResponse.json(deserialize(toRow(row.rows[0])))
}
