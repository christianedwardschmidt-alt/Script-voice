import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

function deserialize(row: Record<string, unknown>) {
  return { ...row, enrolled: !!row.enrolled }
}

export async function GET() {
  const rows = await queryAll(`SELECT * FROM courses ORDER BY id ASC`)
  return NextResponse.json(rows.map(deserialize))
}
