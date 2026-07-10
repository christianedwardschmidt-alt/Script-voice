import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ slug: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params

  const agent = await queryOne<{ id: number }>(
    `SELECT id FROM marketplace_agents WHERE slug = ? AND approved = 1`,
    [slug]
  )
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date().toISOString()
  await execute(`UPDATE marketplace_agents SET clone_count = clone_count + 1 WHERE id = ?`, [agent.id])
  await execute(
    `INSERT INTO marketplace_clone_events (marketplace_agent_id, user_id, created_at) VALUES (?,?,?)`,
    [agent.id, user.id, now]
  )

  return NextResponse.json({ ok: true })
}
