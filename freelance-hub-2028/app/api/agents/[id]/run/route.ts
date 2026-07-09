import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const rows = await queryAll(`SELECT * FROM agents WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const agent = rows[0] as Record<string, unknown>
  const now = new Date().toISOString()

  const runResult = await execute(
    `INSERT INTO agent_runs (agent_id,user_id,status,trigger_event,action_taken,ran_at) VALUES (?,?,?,?,?,?)`,
    [Number(id), user.id, 'success', 'Manual trigger', `Executed: ${String(agent.name)}`, now]
  )

  await execute(
    `UPDATE agents SET run_count = run_count + 1, last_run = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    [now, now, Number(id), user.id]
  )

  const run = await queryAll(`SELECT * FROM agent_runs WHERE id = ?`, [runResult.lastInsertRowid])
  return NextResponse.json({ ok: true, run: run[0] })
}
