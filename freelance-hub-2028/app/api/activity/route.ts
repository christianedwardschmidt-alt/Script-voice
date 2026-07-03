import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10)
  const rows = await queryAll(`SELECT * FROM activity_log ORDER BY id DESC LIMIT ?`, [limit])
  return NextResponse.json(rows)
}
