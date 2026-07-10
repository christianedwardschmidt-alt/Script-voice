import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { sendEmail, emailTemplate } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.guildwire.io'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const item = await queryOne<{ id: number; watchdog_run_id: number; resolved: number; action_data: string }>(
    `SELECT id, watchdog_run_id, resolved, action_data FROM watchdog_items WHERE id = ? AND user_id = ?`, [id, user.id]
  )
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = JSON.parse(item.action_data || '{}')

  const clientRow = await queryOne<{ id: number; name: string; company: string; email: string }>(
    `SELECT id, name, company, email FROM crm_clients WHERE id = ? AND user_id = ?`, [data.clientId, user.id]
  )
  const clientName = clientRow?.name ?? data.client ?? 'there'
  const company = clientRow?.company ?? data.company ?? ''

  const subject = `Checking in`
  const defaultMessage = `Hi ${clientName}, it's been a little while since we last connected${company ? ` on things over at ${company}` : ''} — wanted to check in and see how everything is going. Let me know if there's anything I can help with, or if it's a good time to catch up.`
  const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : defaultMessage

  await sendEmail({
    userId: user.id,
    to: clientRow?.email || '',
    subject,
    html: emailTemplate({
      heading: subject,
      bodyLines: [message],
      ctaLabel: 'View client', ctaHref: `${APP_URL}/clients?client=${data.clientId ?? ''}`,
    }),
    relatedType: 'crm_client', relatedId: String(data.clientId ?? ''),
  })

  const now = new Date().toISOString()
  if (!item.resolved) {
    await execute(`UPDATE watchdog_items SET resolved = 1, resolved_at = ? WHERE id = ?`, [now, id])
    await execute(`UPDATE watchdog_runs SET items_resolved = items_resolved + 1 WHERE id = ?`, [item.watchdog_run_id])
  }

  return NextResponse.json({ ok: true, sentTo: clientRow?.email || null, message, subject })
}
