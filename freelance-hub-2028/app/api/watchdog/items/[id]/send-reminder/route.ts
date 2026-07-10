import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { sendEmail, emailTemplate } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.guildwire.io'

type Params = { params: Promise<{ id: string }> }

function money(n: number): string {
  return `$${Number(n ?? 0).toLocaleString()}`
}

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

  const invoice = await queryOne<{ id: string; client: string; amount: number }>(
    `SELECT id, client, amount FROM invoices WHERE id = ? AND user_id = ?`, [data.invoiceId, user.id]
  )
  const clientName = invoice?.client ?? data.client ?? 'there'
  // invoices.client stores the company/display name (e.g. "TechFlow Inc"), which
  // matches crm_clients.company, not crm_clients.name (the contact's own name).
  const clientRow = await queryOne<{ email: string }>(
    `SELECT email FROM crm_clients WHERE user_id = ? AND lower(company) = lower(?)`, [user.id, clientName]
  )

  const amount = invoice?.amount ?? data.amount ?? 0
  const daysOverdue = data.daysOverdue ?? null
  const subject = `Following up on Invoice ${data.invoiceId ?? ''}`.trim()
  const defaultMessage = `Hi ${clientName}, just a friendly reminder that Invoice ${data.invoiceId ?? ''} for ${money(amount)} is ${daysOverdue ? `now ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} past due` : 'still outstanding'}. Let me know if you have any questions — happy to help however I can.`
  const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : defaultMessage

  await sendEmail({
    userId: user.id,
    to: clientRow?.email || '',
    subject,
    html: emailTemplate({
      heading: subject,
      bodyLines: [message],
      ctaLabel: 'View invoice', ctaHref: `${APP_URL}/invoicing?invoice=${data.invoiceId ?? ''}`,
    }),
    relatedType: 'invoice', relatedId: String(data.invoiceId ?? ''),
  })

  const now = new Date().toISOString()
  if (!item.resolved) {
    await execute(`UPDATE watchdog_items SET resolved = 1, resolved_at = ? WHERE id = ?`, [now, id])
    await execute(`UPDATE watchdog_runs SET items_resolved = items_resolved + 1 WHERE id = ?`, [item.watchdog_run_id])
  }

  return NextResponse.json({ ok: true, sentTo: clientRow?.email || null, message, subject })
}
