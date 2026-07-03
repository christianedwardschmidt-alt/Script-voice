import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10)
  const rows = db.prepare(`SELECT * FROM activity_log ORDER BY id DESC LIMIT ?`).all(limit)
  return NextResponse.json(rows)
}
