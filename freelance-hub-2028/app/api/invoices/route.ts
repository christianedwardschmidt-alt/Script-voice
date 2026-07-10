import { NextRequest, NextResponse } from 'next/server'
import { queryAll, queryOne, execute, logActivity } from '@/lib/db'
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

async function applyLateFees(userId: number, rows: InvoiceRow[]): Promise<InvoiceRow[]> {
  const updated: InvoiceRow[] = []
  for (const inv of rows) {
    const { shouldApply, feeAmount } = computeLateFee(inv)
    if (shouldApply && (!inv.late_fee_applied || inv.late_fee_amount !== feeAmount)) {
      await execute(
        `UPDATE invoices SET late_fee_applied=1, late_fee_amount=? WHERE id=? AND user_id=?`,
        [feeAmount, inv.id, userId]
      )
      updated.push({ ...inv, late_fee_applied: 1, late_fee_amount: feeAmount })
    } else {
      updated.push(inv)
    }
  }
  return updated
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryAll<InvoiceRow>(`SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC`, [user.id])
  const withFees = await applyLateFees(user.id, rows)
  return NextResponse.json(withFees)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { client, project, amount, status, issued, due, avatar, color,
    late_fee_enabled, late_fee_percentage, late_fee_grace_days } = body

  const last = await queryOne<{ id: string }>(`SELECT id FROM invoices WHERE user_id = ? ORDER BY rowid DESC LIMIT 1`, [user.id])
  let nextNum = 100
  if (last?.id) {
    const m = last.id.match(/(\d+)$/)
    if (m) nextNum = parseInt(m[1], 10) + 1
  }
  const id = `INV-${user.id}-${String(nextNum).padStart(3, '0')}`

  await execute(
    `INSERT INTO invoices (id,user_id,client,project,amount,status,issued,due,avatar,color,late_fee_enabled,late_fee_percentage,late_fee_grace_days) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, user.id, client, project ?? '', amount ?? 0, status ?? 'Draft', issued ?? '', due ?? '',
     avatar ?? '👤', color ?? '#16a34a',
     late_fee_enabled ? 1 : 0, late_fee_percentage ?? 1.5, late_fee_grace_days ?? 30]
  )
  logActivity(user.id, `Created invoice ${id} for ${client}`)
  const row = await queryOne<InvoiceRow>(`SELECT * FROM invoices WHERE id = ?`, [id])
  const [withFee] = await applyLateFees(user.id, [row!])
  return NextResponse.json(withFee, { status: 201 })
}
