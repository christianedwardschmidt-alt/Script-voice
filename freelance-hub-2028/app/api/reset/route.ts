import { NextResponse } from 'next/server'
import { execute } from '@/lib/db'

export async function POST() {
  const tables = [
    'clients', 'crm_clients', 'tasks', 'invoices', 'posts',
    'calendar_events', 'tax_deductions', 'tax_documents', 'activity_log',
    'jobs', 'courses', 'integrations',
  ]
  for (const t of tables) {
    await execute(`DELETE FROM ${t}`)
  }
  return NextResponse.json({ ok: true })
}
