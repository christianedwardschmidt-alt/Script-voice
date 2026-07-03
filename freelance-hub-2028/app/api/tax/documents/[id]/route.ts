import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute, logActivity } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await queryOne<{ name: string }>(`SELECT name FROM tax_documents WHERE id = ?`, [id])
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await execute(`DELETE FROM tax_documents WHERE id = ?`, [id])
  logActivity(`Removed document: ${existing.name}`)
  return NextResponse.json({ success: true })
}
