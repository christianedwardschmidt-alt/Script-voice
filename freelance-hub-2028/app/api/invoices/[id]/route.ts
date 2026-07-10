import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface InvoiceRow {
  id: string; user_id: number; client: string; project: string
  amount: number; status: string; issued: string; due: string; avatar: string; color: string
  late_fee_enabled: number; late_fee_percentage: number; late_fee_grace_days: number
  late_fee_applied: number; late_fee_amount: number; late_fee_waived: number
}

function computeLateFee(inv: InvoiceRow): { shouldApply: boolean; feeAmount: number } {
  if (!inv.late_fee_enabled || inv.status === 'Paid' || inv.late_fee_waived || !inv.due) {
    return { shouldApply: false, feeAmount: 0 }
  }
  const dueDate = new Date(inv.due)
  const today = new Date()
  const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysPastDue >= (inv.late_fee_grace_days ?? 30)) {
    const fee = Math.round((inv.amount ?? 0) * ((inv.late_fee_percentage ?? 1.5) / 100) * 100) / 100
    return { shouldApply: true, feeAmount: fee }
  }
  return { shouldApply: false, feeAmount: 0 }
}

async function applyLateFeeSingle(userId: number, inv: InvoiceRow): Promise<InvoiceRow> {
  const { shouldApply, feeAmount } = computeLateFee(inv)
  if (shouldApply && (!inv.late_fee_applied || inv.late_fee_amount !== feeAmount)) {
    await execute(
      `UPDATE invoices SET late_fee_applied=1, late_fee_amount=? WHERE id=? AND user_id=?`,
      [feeAmount, inv.id, userId]
    )
    return { ...inv, late_fee_applied: 1, late_fee_amount: feeAmount }
  }
  return inv
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const row = await queryOne<InvoiceRow>(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const withFee = await applyLateFeeSingle(user.id, row)
  return NextResponse.json(withFee)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne<InvoiceRow>(`SELECT * FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()

  const next = { ...existing }
  for (const f of ['client', 'project', 'amount', 'status', 'issued', 'due', 'avatar', 'color'] as const) {
    if (body[f] !== undefined) (next as Record<string, unknown>)[f] = body[f]
  }
  for (const f of ['late_fee_enabled', 'late_fee_grace_days'] as const) {
    if (body[f] !== undefined) next[f] = Number(body[f])
  }
  if (body.late_fee_percentage !== undefined) next.late_fee_percentage = parseFloat(body.late_fee_percentage)
  if (body.late_fee_waived !== undefined) {
    next.late_fee_waived = body.late_fee_waived ? 1 : 0
    if (body.late_fee_waived) {
      next.late_fee_applied = 0
      logActivity(user.id, `Late fee waived on invoice ${id}`)
    }
  }

  await execute(
    `UPDATE invoices SET client=?,project=?,amount=?,status=?,issued=?,due=?,avatar=?,color=?,late_fee_enabled=?,late_fee_percentage=?,late_fee_grace_days=?,late_fee_applied=?,late_fee_amount=?,late_fee_waived=? WHERE id=? AND user_id=?`,
    [next.client, next.project, next.amount, next.status, next.issued, next.due, next.avatar, next.color,
     next.late_fee_enabled, next.late_fee_percentage, next.late_fee_grace_days,
     next.late_fee_applied, next.late_fee_amount, next.late_fee_waived,
     id, user.id]
  )

  if (body.status !== undefined && body.status !== existing.status) {
    logActivity(user.id, `Invoice ${id} marked as ${body.status}`)
  }

  const row = await queryOne<InvoiceRow>(`SELECT * FROM invoices WHERE id = ?`, [id])
  const withFee = await applyLateFeeSingle(user.id, row!)
  return NextResponse.json(withFee)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne(`SELECT id FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM invoices WHERE id = ? AND user_id = ?`, [id, user.id])
  logActivity(user.id, `Deleted invoice ${id}`)
  return NextResponse.json({ success: true })
}
