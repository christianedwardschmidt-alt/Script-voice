import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne<{ category: string }>(`SELECT category FROM tax_deductions WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM tax_deductions WHERE id = ?`, [id])
  logActivity(`Removed tax deduction: ${existing.category}`)
  return NextResponse.json({ success: true })
}
