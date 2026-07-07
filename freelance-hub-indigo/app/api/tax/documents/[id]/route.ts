import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.execute({ sql: `SELECT name FROM tax_documents WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.execute({ sql: `DELETE FROM tax_documents WHERE id = ? AND user_id = ?`, args: [id, user.id] })
  await logActivity(user.id, `Removed document: ${existing.rows[0].name}`)
  return NextResponse.json({ success: true })
}
