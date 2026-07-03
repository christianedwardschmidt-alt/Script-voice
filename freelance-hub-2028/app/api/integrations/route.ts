import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, connected: !!row.connected }
}

export async function GET() {
  const rows = await queryAll(`SELECT * FROM integrations ORDER BY rowid ASC`)
  return NextResponse.json(rows.map(deserialize))
}
