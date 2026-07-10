import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`UPDATE agent_suggestions SET dismissed = 1 WHERE id = ? AND user_id = ?`, [id, user.id])
  return NextResponse.json({ ok: true })
}
