import { NextResponse } from 'next/server'
import db from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    saved: !!row.saved,
    applied: !!row.applied,
  }
}

export async function GET() {
  const rows = db.prepare(`SELECT * FROM jobs ORDER BY id DESC`).all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(deserialize))
}
