import { NextResponse } from 'next/server'
import db from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function GET() {
  const rows = db.prepare(`SELECT * FROM courses ORDER BY id ASC`).all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(deserialize))
}
