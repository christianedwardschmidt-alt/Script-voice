import { NextResponse } from 'next/server'
import { queryOne, queryAll } from '@/lib/db'

export async function GET() {
  const settings = await queryOne(`SELECT id FROM settings WHERE id = 1`)
  const clients = await queryAll(`SELECT COUNT(*) as cnt FROM clients`)
  const tasks = await queryAll(`SELECT COUNT(*) as cnt FROM tasks`)
  const invoices = await queryAll(`SELECT COUNT(*) as cnt FROM invoices`)
  const jobs = await queryAll(`SELECT COUNT(*) as cnt FROM jobs`)

  return NextResponse.json({
    dbUrl: process.env.TURSO_DATABASE_URL ? 'turso (' + process.env.TURSO_DATABASE_URL.slice(0, 30) + '…)' : 'file:/tmp (no TURSO_DATABASE_URL set!)',
    settingsExists: !!settings,
    counts: {
      clients: clients[0]?.cnt,
      tasks: tasks[0]?.cnt,
      invoices: invoices[0]?.cnt,
      jobs: jobs[0]?.cnt,
    }
  })
}
// force rebuild Fri Jul  3 18:35:06 UTC 2026
