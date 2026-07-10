import { NextRequest, NextResponse } from 'next/server'
import { queryOne, queryAll, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

const PERIOD_DAYS: Record<string, number | null> = {
  week: 7,
  month: 30,
  '3months': 90,
  all: null,
}

function isRevenueAgent(agent: { template_id: string; trigger_type: string }): boolean {
  return agent.template_id === 'invoice-reminder' || agent.trigger_type === 'invoice-overdue'
}

async function checkRevenueMilestones(userId: number): Promise<void> {
  const totalRow = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(ip.amount), 0) as total
     FROM invoice_payments ip
     WHERE ip.user_id = ?
       AND EXISTS (
         SELECT 1 FROM agent_runs ar
         WHERE ar.user_id = ip.user_id AND ar.status != 'running'
           AND julianday(ip.paid_at) - julianday(ar.ran_at) BETWEEN 0 AND 7
       )`,
    [userId]
  )
  const total = Number(totalRow?.total ?? 0)
  const now = new Date().toISOString()
  for (const m of [1000, 5000, 10000]) {
    if (total < m) continue
    const type = `revenue_milestone_${m}`
    const already = await queryOne(`SELECT id FROM notifications WHERE user_id = ? AND type = ?`, [userId, type])
    if (already) continue
    await execute(
      `INSERT INTO notifications (user_id,type,title,body,href,created_at) VALUES (?,?,?,?,?,?)`,
      [
        userId, type, 'Your agents are earning their keep',
        `Your agents have now recovered over $${m.toLocaleString()} in payments for your business. Know another independent professional who could use this? Share GuildWire with them.`,
        '/agents', now,
      ]
    )
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const period = req.nextUrl.searchParams.get('period') || 'month'
  const days = period in PERIOD_DAYS ? PERIOD_DAYS[period] : 30

  const agent = await queryOne<{ id: number; name: string; template_id: string; trigger_type: string; run_count: number; custom_time_estimate: number; created_at: string }>(
    `SELECT id, name, template_id, trigger_type, run_count, custom_time_estimate, created_at FROM agents WHERE id = ? AND user_id = ?`,
    [id, user.id]
  )
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const periodStart = days ? new Date(now.getTime() - days * 86400000) : new Date(agent.created_at)
  const prevStart = days ? new Date(periodStart.getTime() - days * 86400000) : null

  const runsInPeriod = await queryAll<{ status: string }>(
    `SELECT status FROM agent_runs WHERE agent_id = ? AND user_id = ? AND status != 'running' AND ran_at >= ?`,
    [id, user.id, periodStart.toISOString()]
  )
  const timesRun = runsInPeriod.length
  const successCount = runsInPeriod.filter(r => r.status === 'success').length
  const successRate = timesRun > 0 ? Math.round((successCount / timesRun) * 100) : 0

  let previousTimesRun: number | null = null
  if (prevStart) {
    const prevRow = await queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM agent_runs WHERE agent_id = ? AND user_id = ? AND status != 'running' AND ran_at >= ? AND ran_at < ?`,
      [id, user.id, prevStart.toISOString(), periodStart.toISOString()]
    )
    previousTimesRun = Number(prevRow?.cnt ?? 0)
  }

  const minutesPerRun = Number(agent.custom_time_estimate ?? 15)
  const timeSavedMinutes = timesRun * minutesPerRun

  const revenueEligible = isRevenueAgent(agent)
  let revenueImpact = 0
  if (revenueEligible) {
    const rev = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(ip.amount), 0) as total
       FROM invoice_payments ip
       WHERE ip.user_id = ? AND ip.paid_at >= ?
         AND EXISTS (
           SELECT 1 FROM agent_runs ar
           WHERE ar.agent_id = ? AND ar.status != 'running'
             AND julianday(ip.paid_at) - julianday(ar.ran_at) BETWEEN 0 AND 7
         )`,
      [user.id, periodStart.toISOString(), id]
    )
    revenueImpact = Number(rev?.total ?? 0)
    if (revenueImpact > 0) await checkRevenueMilestones(user.id)
  }

  return NextResponse.json({
    period,
    agentName: agent.name,
    runCountAllTime: Number(agent.run_count ?? 0),
    timesRun,
    previousTimesRun,
    successRate,
    timeSavedMinutes,
    minutesPerRun,
    revenueEligible,
    revenueImpact,
  })
}
