import { NextResponse } from 'next/server'
import { execute, queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userTables = [
    'clients', 'crm_clients', 'tasks', 'invoices',
    'calendar_events', 'tax_deductions', 'tax_documents', 'activity_log',
  ]
  for (const t of userTables) {
    await execute(`DELETE FROM ${t} WHERE user_id = ?`, [user.id])
  }
  const clientCount = await queryAll(`SELECT COUNT(*) as cnt FROM clients WHERE user_id = ?`, [user.id])
  return NextResponse.json({ ok: true, clientsRemaining: clientCount[0]?.cnt })
}
