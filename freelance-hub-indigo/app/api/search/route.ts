import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json([])

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const like = `%${q}%`
  const uid = user.id
  const results: { type: string; label: string; sub: string; href: string }[] = []

  const [clients, tasks, invoices, crm, events, jobs] = await Promise.all([
    db.execute({ sql: `SELECT name, company FROM clients WHERE user_id=? AND (name LIKE ? OR company LIKE ?) LIMIT 3`, args: [uid, like, like] }),
    db.execute({ sql: `SELECT title, status FROM tasks WHERE user_id=? AND title LIKE ? LIMIT 3`, args: [uid, like] }),
    db.execute({ sql: `SELECT id, client FROM invoices WHERE user_id=? AND (id LIKE ? OR client LIKE ?) LIMIT 3`, args: [uid, like, like] }),
    db.execute({ sql: `SELECT name, company, stage FROM crm_clients WHERE user_id=? AND (name LIKE ? OR company LIKE ?) LIMIT 3`, args: [uid, like, like] }),
    db.execute({ sql: `SELECT title, date FROM calendar_events WHERE user_id=? AND (title LIKE ? OR client LIKE ?) LIMIT 3`, args: [uid, like, like] }),
    db.execute({ sql: `SELECT title, company FROM jobs WHERE user_id=? AND (title LIKE ? OR company LIKE ?) LIMIT 3`, args: [uid, like, like] }),
  ])

  for (const r of clients.rows) results.push({ type: 'Client', label: String(r.name), sub: String(r.company), href: '/clients' })
  for (const r of tasks.rows) results.push({ type: 'Task', label: String(r.title), sub: String(r.status), href: '/tasks' })
  for (const r of invoices.rows) results.push({ type: 'Invoice', label: String(r.id), sub: String(r.client), href: '/invoicing' })
  for (const r of crm.rows) results.push({ type: 'CRM', label: String(r.name), sub: `${r.company} · ${r.stage}`, href: '/crm' })
  for (const r of events.rows) results.push({ type: 'Event', label: String(r.title), sub: String(r.date), href: '/calendar' })
  for (const r of jobs.rows) results.push({ type: 'Job', label: String(r.title), sub: String(r.company), href: '/jobs' })

  return NextResponse.json(results.slice(0, 10))
}
