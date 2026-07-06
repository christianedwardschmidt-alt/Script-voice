import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const like = `%${q}%`
  const results: { type: string; label: string; sub: string; href: string }[] = []

  const clients = await queryAll(`SELECT name, company FROM clients WHERE user_id = ? AND (name LIKE ? OR company LIKE ?) LIMIT 3`, [user.id, like, like])
  for (const c of clients) results.push({ type: 'Client', label: c.name as string, sub: c.company as string, href: '/clients' })

  const tasks = await queryAll(`SELECT title, status FROM tasks WHERE user_id = ? AND title LIKE ? LIMIT 3`, [user.id, like])
  for (const t of tasks) results.push({ type: 'Task', label: t.title as string, sub: t.status as string, href: '/tasks' })

  const invoices = await queryAll(`SELECT id, client FROM invoices WHERE user_id = ? AND (id LIKE ? OR client LIKE ?) LIMIT 3`, [user.id, like, like])
  for (const i of invoices) results.push({ type: 'Invoice', label: i.id as string, sub: i.client as string, href: '/invoicing' })

  const crm = await queryAll(`SELECT name, company, stage FROM crm_clients WHERE user_id = ? AND (name LIKE ? OR company LIKE ?) LIMIT 3`, [user.id, like, like])
  for (const c of crm) results.push({ type: 'CRM', label: c.name as string, sub: `${c.company} · ${c.stage}`, href: '/crm' })

  const events = await queryAll(`SELECT title, date FROM calendar_events WHERE user_id = ? AND (title LIKE ? OR client LIKE ?) LIMIT 3`, [user.id, like, like])
  for (const e of events) results.push({ type: 'Event', label: e.title as string, sub: e.date as string, href: '/calendar' })

  const jobs = await queryAll(`SELECT title, company FROM jobs WHERE title LIKE ? OR company LIKE ? LIMIT 3`, [like, like])
  for (const j of jobs) results.push({ type: 'Job', label: j.title as string, sub: j.company as string, href: '/jobs' })

  return NextResponse.json(results.slice(0, 10))
}
