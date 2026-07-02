import { NextResponse } from 'next/server'
import db from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function GET() {
  const rows = db.prepare(`SELECT * FROM integrations ORDER BY rowid ASC`).all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(deserialize))
}
