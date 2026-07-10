import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { approveDraftAndFire, type RecurringTemplate } from '@/lib/recurringInvoices'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const { invoiceId, amount } = body
  if (!invoiceId || !(Number(amount) > 0)) return NextResponse.json({ error: 'invoiceId and a positive amount are required' }, { status: 400 })

  const t = await queryOne<RecurringTemplate>(`SELECT * FROM recurring_invoice_templates WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoice = await queryOne<{ id: string; awaiting_amount: number }>(`SELECT id, awaiting_amount FROM invoices WHERE id = ? AND user_id = ? AND recurring_template_id = ?`, [invoiceId, user.id, id])
  if (!invoice) return NextResponse.json({ error: 'Draft invoice not found for this schedule' }, { status: 404 })
  if (!invoice.awaiting_amount) return NextResponse.json({ error: 'This invoice is not awaiting an amount' }, { status: 400 })

  await approveDraftAndFire(t, invoiceId, Number(amount))
  const updated = await queryOne(`SELECT * FROM recurring_invoice_templates WHERE id = ?`, [id])
  return NextResponse.json({ success: true, template: updated })
}
