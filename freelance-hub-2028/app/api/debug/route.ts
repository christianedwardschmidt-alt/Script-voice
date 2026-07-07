import { NextResponse } from 'next/server'
import { queryOne, queryAll } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await queryAll(`SELECT COUNT(*) as cnt FROM clients WHERE user_id = ?`, [user.id])
  const tasks = await queryAll(`SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ?`, [user.id])
  const invoices = await queryAll(`SELECT COUNT(*) as cnt FROM invoices WHERE user_id = ?`, [user.id])
  const jobs = await queryAll(`SELECT COUNT(*) as cnt FROM jobs WHERE user_id = ?`, [user.id])
  const profile = await queryOne(`SELECT displayName FROM profile WHERE user_id = ?`, [user.id])

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    displayName: (profile as Record<string, unknown> | null)?.displayName,
    counts: {
      clients: clients[0]?.cnt,
      tasks: tasks[0]?.cnt,
      invoices: invoices[0]?.cnt,
      jobs: jobs[0]?.cnt,
    }
  })
}
