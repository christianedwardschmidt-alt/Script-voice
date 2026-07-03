import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM integrations WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const connected = body.connected ? 1 : 0
  const lastSync = connected ? 'just now' : null

  db.prepare(`UPDATE integrations SET connected=?, lastSync=? WHERE id=?`).run(connected, lastSync, id)

  logActivity(connected ? `Connected ${existing.name}` : `Disconnected ${existing.name}`)

  const row = db.prepare(`SELECT * FROM integrations WHERE id = ?`).get(id) as Record<string, unknown>
  return NextResponse.json(deserialize(row))
}
