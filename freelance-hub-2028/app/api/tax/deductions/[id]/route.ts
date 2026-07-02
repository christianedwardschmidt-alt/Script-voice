import { NextRequest, NextResponse } from 'next/server'
import db, { logActivity } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = db.prepare(`SELECT * FROM tax_deductions WHERE id = ?`).get(id) as { category: string } | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  db.prepare(`DELETE FROM tax_deductions WHERE id = ?`).run(id)
  logActivity(`Removed tax deduction: ${existing.category}`)
  return NextResponse.json({ success: true })
}
