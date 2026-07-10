import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { firstSendDate, todayStr, upcomingOccurrences, type RecurringTemplate } from '@/lib/recurringInvoices'
import { notify } from '@/lib/notify'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const t = await queryOne<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const logs = await queryAll(`SELECT * FROM recurring_invoice_logs WHERE template_id = ? ORDER BY id DESC LIMIT 20`, [id])
  return NextResponse.json({
    ...t,
    line_items: JSON.parse(t.line_items || '[]'),
    upcoming: t.status === 'active' ? upcomingOccurrences(t, 3) : [],
    logs,
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const now = new Date().toISOString()

  if (body.action === 'pause') {
    if (existing.status !== 'active') return NextResponse.json({ error: 'Only active schedules can be paused' }, { status: 400 })
    await execute(`UPDATE recurring_invoice_templates SET status = 'paused', updated_at = ? WHERE id = ?`, [now, id])
    logActivity(user.id, `Paused recurring invoice schedule for ${existing.client_name}`)
  } else if (body.action === 'unpause') {
    if (existing.status !== 'paused') return NextResponse.json({ error: 'Only paused schedules can be resumed' }, { status: 400 })
    const today = todayStr()
    const nextSendDate = existing.next_send_date <= today
      ? firstSendDate(existing.next_send_date, existing.frequency, existing.custom_interval, existing.custom_period, today)
      : existing.next_send_date
    await execute(`UPDATE recurring_invoice_templates SET status = 'active', next_send_date = ?, updated_at = ? WHERE id = ?`, [nextSendDate, now, id])
    logActivity(user.id, `Resumed recurring invoice schedule for ${existing.client_name}`)
  } else if (body.action === 'cancel') {
    if (existing.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    await execute(`UPDATE recurring_invoice_templates SET status = 'cancelled', updated_at = ? WHERE id = ?`, [now, id])
    logActivity(user.id, `Cancelled recurring invoice schedule for ${existing.client_name}`)
  } else {
    const next: Record<string, unknown> = {}
    for (const f of ['send_time', 'client_notification_enabled', 'end_condition', 'end_after_occurrences', 'end_date'] as const) {
      if (body[f] !== undefined) next[f] = f === 'client_notification_enabled' ? (body[f] ? 1 : 0) : body[f]
    }
    if (Object.keys(next).length === 0) return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    const setClause = Object.keys(next).map(k => `${k} = ?`).join(', ')
    await execute(`UPDATE recurring_invoice_templates SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(next) as (string | number | null)[], now, id])
  }

  if (body.action) {
    await notify({
      userId: user.id,
      type: `recurring_invoice_${body.action}d`,
      title: `Recurring schedule ${body.action === 'unpause' ? 'resumed' : body.action + 'd'}`,
      body: `The recurring invoice schedule for ${existing.client_name} was ${body.action === 'unpause' ? 'resumed' : body.action + 'd'}.`,
      href: `/invoicing?tab=recurring&template=${id}`,
      meta: { templateId: Number(id) },
    })
  }

  const row = await queryOne<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE id = ?`, [id])
  return NextResponse.json({ ...row, line_items: JSON.parse(row!.line_items || '[]'), upcoming: row!.status === 'active' ? upcomingOccurrences(row!, 3) : [] })
}
