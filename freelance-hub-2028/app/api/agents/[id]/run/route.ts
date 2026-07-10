import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { simulateAgentRun, generateRunSummary, pruneAgentRuns } from '@/lib/agentRun'

type Params = { params: Promise<{ id: string }> }

const RUN_DELAY_MS = 6500

function deserializeRun(row: Record<string, unknown>) {
  return {
    ...row,
    technical_log: row.technical_log ? JSON.parse(row.technical_log as string) : null,
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const rows = await queryAll(`SELECT * FROM agents WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const agentRow = rows[0] as Record<string, unknown>
  const triggerEvent = 'Manual trigger'
  const startedAt = new Date().toISOString()

  const runResult = await execute(
    `INSERT INTO agent_runs (agent_id,user_id,status,trigger_event,action_taken,ran_at) VALUES (?,?,?,?,?,?)`,
    [Number(id), user.id, 'running', triggerEvent, '', startedAt]
  )
  const runId = Number(runResult.lastInsertRowid)

  await new Promise(resolve => setTimeout(resolve, RUN_DELAY_MS))

  const outcome = await simulateAgentRun(
    {
      id: Number(agentRow.id),
      name: String(agentRow.name ?? ''),
      template_id: String(agentRow.template_id ?? ''),
      trigger_type: String(agentRow.trigger_type ?? ''),
      actions: agentRow.actions ? JSON.parse(agentRow.actions as string) : [],
    },
    user.id,
    triggerEvent,
    runId
  )

  const completedAt = new Date().toISOString()
  await execute(
    `UPDATE agent_runs SET status = ?, action_taken = ?, technical_log = ?, ran_at = ? WHERE id = ?`,
    [outcome.status, outcome.actionTaken, JSON.stringify(outcome.technicalLog), completedAt, runId]
  )
  await execute(
    `UPDATE agents SET run_count = run_count + 1, last_run = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    [completedAt, completedAt, Number(id), user.id]
  )
  await pruneAgentRuns(Number(id))

  after(async () => {
    const summary = await generateRunSummary({
      agentName: String(agentRow.name ?? ''),
      triggerEvent,
      status: outcome.status,
      actionTaken: outcome.actionTaken,
      technicalLog: outcome.technicalLog,
    })
    if (summary) {
      await execute(`UPDATE agent_runs SET human_readable_summary = ? WHERE id = ?`, [summary, runId])
    }
  })

  const run = await queryAll(`SELECT * FROM agent_runs WHERE id = ?`, [runId])
  return NextResponse.json({ ok: true, run: deserializeRun(run[0] as Record<string, unknown>) })
}
