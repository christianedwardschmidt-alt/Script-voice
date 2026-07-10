import { NextRequest, NextResponse } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import type { InValue } from '@libsql/client'

type Params = { params: Promise<{ id: string }> }

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    trigger_config: row.trigger_config ? JSON.parse(row.trigger_config as string) : {},
    conditions: row.conditions ? JSON.parse(row.conditions as string) : [],
    actions: row.actions ? JSON.parse(row.actions as string) : [],
    run_count: Number(row.run_count ?? 0),
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const rows = await queryAll(`SELECT * FROM agents WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await queryAll(
    `SELECT * FROM agent_runs WHERE agent_id = ? AND user_id = ? ORDER BY ran_at DESC LIMIT 20`,
    [id, user.id]
  )
  return NextResponse.json({ agent: deserialize(rows[0] as Record<string, unknown>), runs })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const updates: string[] = []
  const args: InValue[] = []

  if ('name' in body) { updates.push('name = ?'); args.push(body.name as string) }
  if ('icon' in body) { updates.push('icon = ?'); args.push(body.icon as string) }
  if ('description' in body) { updates.push('description = ?'); args.push(body.description as string) }
  if ('status' in body) { updates.push('status = ?'); args.push(body.status as string) }
  if ('trigger_type' in body) { updates.push('trigger_type = ?'); args.push(body.trigger_type as string) }
  if ('trigger_config' in body) { updates.push('trigger_config = ?'); args.push(JSON.stringify(body.trigger_config)) }
  if ('conditions' in body) { updates.push('conditions = ?'); args.push(JSON.stringify(body.conditions)) }
  if ('actions' in body) { updates.push('actions = ?'); args.push(JSON.stringify(body.actions)) }
  if ('custom_time_estimate' in body) { updates.push('custom_time_estimate = ?'); args.push(Number(body.custom_time_estimate) || 15) }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(Number(id))
  args.push(user.id)

  if (updates.length > 1) {
    await execute(`UPDATE agents SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, args)
  }

  const rows = await queryAll(`SELECT * FROM agents WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(deserialize(rows[0] as Record<string, unknown>))
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`DELETE FROM agent_runs WHERE agent_id = ? AND user_id = ?`, [Number(id), user.id])
  await execute(`DELETE FROM agents WHERE id = ? AND user_id = ?`, [Number(id), user.id])
  return NextResponse.json({ ok: true })
}
