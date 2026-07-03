import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const like = `%${q}%`
  const results: { type: string; label: string; sub: string; href: string }[] = []

  const clients = db.prepare(`SELECT name, company FROM clients WHERE name LIKE ? OR company LIKE ? LIMIT 3`).all(like, like) as any[]
  for (const c of clients) results.push({ type: 'Client', label: c.name, sub: c.company, href: '/clients' })

  const tasks = db.prepare(`SELECT title, status FROM tasks WHERE title LIKE ? LIMIT 3`).all(like) as any[]
  for (const t of tasks) results.push({ type: 'Task', label: t.title, sub: t.status, href: '/tasks' })

  const invoices = db.prepare(`SELECT id, client FROM invoices WHERE id LIKE ? OR client LIKE ? LIMIT 3`).all(like, like) as any[]
  for (const i of invoices) results.push({ type: 'Invoice', label: i.id, sub: i.client, href: '/invoicing' })

  const crm = db.prepare(`SELECT name, company, stage FROM crm_clients WHERE name LIKE ? OR company LIKE ? LIMIT 3`).all(like, like) as any[]
  for (const c of crm) results.push({ type: 'CRM', label: c.name, sub: `${c.company} · ${c.stage}`, href: '/crm' })

  const events = db.prepare(`SELECT title, date FROM calendar_events WHERE title LIKE ? OR client LIKE ? LIMIT 3`).all(like, like) as any[]
  for (const e of events) results.push({ type: 'Event', label: e.title, sub: e.date, href: '/calendar' })

  const jobs = db.prepare(`SELECT title, company FROM jobs WHERE title LIKE ? OR company LIKE ? LIMIT 3`).all(like, like) as any[]
  for (const j of jobs) results.push({ type: 'Job', label: j.title, sub: j.company, href: '/jobs' })

  return NextResponse.json(results.slice(0, 10))
}
