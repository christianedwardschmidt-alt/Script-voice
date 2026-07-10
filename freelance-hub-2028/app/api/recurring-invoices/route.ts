import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { firstSendDate, todayStr, upcomingOccurrences, type RecurringTemplate } from '@/lib/recurringInvoices'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const COLORS = ['#16A34A', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6']

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE user_id = ? ORDER BY id DESC`, [user.id])
  const withUpcoming = rows.map(t => ({
    ...t,
    line_items: JSON.parse(t.line_items || '[]'),
    upcoming: t.status === 'active' ? upcomingOccurrences(t, 3) : [],
  }))
  return NextResponse.json(withUpcoming)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const {
    client, project = '', lineItems = [],
    amountMode = 'fixed', frequency = 'monthly',
    customInterval = 1, customPeriod = 'days',
    startDate, endCondition = 'indefinite', endAfterOccurrences = null, endDate = null,
    sendTime = '09:00', clientNotificationEnabled = true,
  } = body

  if (!client || !startDate) return NextResponse.json({ error: 'Client and start date are required' }, { status: 400 })

  const subtotal = (lineItems as AnyRecord[]).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0)
  if (amountMode === 'fixed' && subtotal <= 0) {
    return NextResponse.json({ error: 'Add at least one line item with an amount' }, { status: 400 })
  }

  const clientRow = await queryOne<{ email: string }>(`SELECT email FROM clients WHERE user_id = ? AND name = ?`, [user.id, client])
  const nextSendDate = firstSendDate(startDate, frequency, Number(customInterval), customPeriod, todayStr())
  const now = new Date().toISOString()
  const existingCount = await queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM recurring_invoice_templates WHERE user_id = ?`, [user.id])
  const color = COLORS[(existingCount?.cnt ?? 0) % COLORS.length]
  const avatar = String(client).trim().charAt(0).toUpperCase() || '?'

  const r = await execute(
    `INSERT INTO recurring_invoice_templates
      (user_id, client_name, client_email, project, line_items, subtotal, tax_rate, total,
       amount_mode, frequency, custom_interval, custom_period, start_date,
       end_condition, end_after_occurrences, end_date, send_time, next_send_date,
       total_sends, client_notification_enabled, status, avatar, color, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?)`,
    [
      user.id, client, clientRow?.email ?? '', project, JSON.stringify(lineItems), subtotal, 0, subtotal,
      amountMode, frequency, Number(customInterval), customPeriod, startDate,
      endCondition, endAfterOccurrences, endDate, sendTime, nextSendDate,
      clientNotificationEnabled ? 1 : 0, 'active', avatar, color, now, now,
    ]
  )

  const row = await queryOne<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE id = ?`, [r.lastInsertRowid])
  return NextResponse.json({ ...row, line_items: JSON.parse(row!.line_items || '[]'), upcoming: upcomingOccurrences(row!, 3) }, { status: 201 })
}
