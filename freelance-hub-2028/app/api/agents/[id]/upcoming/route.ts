import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { upcomingRunsForAgent } from '@/lib/agentScheduler'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const agent = await queryOne(`SELECT id FROM agents WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await upcomingRunsForAgent(Number(id))
  return NextResponse.json({ runs })
}
