import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne(`SELECT * FROM integrations WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const connected = body.connected ? 1 : 0
  const lastSync = connected ? 'just now' : null

  await execute(`UPDATE integrations SET connected=?, lastSync=? WHERE id=?`, [connected, lastSync, id])

  logActivity(connected ? `Connected ${existing.name}` : `Disconnected ${existing.name}`)

  const row = await queryOne(`SELECT * FROM integrations WHERE id = ?`, [id])
  return NextResponse.json(deserialize(row!))
}
