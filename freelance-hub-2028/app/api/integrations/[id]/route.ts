import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await queryOne(`SELECT * FROM integrations WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const connected = body.connected ? 1 : 0
  const lastSync = connected ? 'just now' : null

  await execute(`UPDATE integrations SET connected=?, lastSync=? WHERE id=? AND user_id=?`, [connected, lastSync, id, user.id])

  logActivity(user.id, connected ? `Connected ${existing.name}` : `Disconnected ${existing.name}`)

  const row = await queryOne(`SELECT * FROM integrations WHERE id = ? AND user_id = ?`, [id, user.id])
  return NextResponse.json(deserialize(row!))
}
