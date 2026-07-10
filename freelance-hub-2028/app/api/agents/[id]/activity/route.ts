import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

function deserializeRun(row: Record<string, unknown>) {
  return {
    ...row,
    technical_log: row.technical_log ? JSON.parse(row.technical_log as string) : null,
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0) || 0)
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 20) || 20))

  const rows = await queryAll(
    `SELECT * FROM agent_runs WHERE agent_id = ? AND user_id = ? ORDER BY ran_at DESC, id DESC LIMIT ? OFFSET ?`,
    [id, user.id, limit + 1, offset]
  )

  const hasMore = rows.length > limit
  const runs = rows.slice(0, limit).map(r => deserializeRun(r as Record<string, unknown>))

  return NextResponse.json({ runs, hasMore })
}
