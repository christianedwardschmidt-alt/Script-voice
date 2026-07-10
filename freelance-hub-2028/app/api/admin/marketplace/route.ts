import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser, isAdmin } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await queryAll<Record<string, unknown>>(
    `SELECT * FROM marketplace_agents WHERE approved = 0 ORDER BY created_at ASC`
  )
  const pending = rows.map(r => ({
    ...r,
    configuration: r.configuration ? JSON.parse(r.configuration as string) : {},
  }))

  return NextResponse.json(pending)
}
