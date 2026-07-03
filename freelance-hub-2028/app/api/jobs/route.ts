import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    saved: !!row.saved,
    applied: !!row.applied,
  }
}

export async function GET() {
  const rows = await queryAll(`SELECT * FROM jobs ORDER BY id DESC`)
  return NextResponse.json(rows.map(deserialize))
}
