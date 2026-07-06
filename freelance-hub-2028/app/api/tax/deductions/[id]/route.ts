import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await queryOne<{ category: string }>(`SELECT category FROM tax_deductions WHERE id = ? AND user_id = ?`, [id, user.id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM tax_deductions WHERE id = ? AND user_id = ?`, [id, user.id])
  logActivity(user.id, `Removed tax deduction: ${existing.category}`)
  return NextResponse.json({ success: true })
}
