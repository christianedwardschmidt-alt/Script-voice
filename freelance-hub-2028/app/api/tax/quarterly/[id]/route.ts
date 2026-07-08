import { NextRequest, NextResponse } from 'next/server'
import { execute, logActivity } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await execute(`DELETE FROM tax_quarterly_payments WHERE id = ? AND user_id = ?`, [id, user.id])
  logActivity(user.id, `Removed quarterly payment record #${id}`)
  return NextResponse.json({ ok: true })
}
