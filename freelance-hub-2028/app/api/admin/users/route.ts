import { NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'
import { getUser, isAdmin } from '@/lib/auth'

interface UserRow {
  id: number
  name: string
  email: string
  created_at: string
}

export async function GET() {
  const user = await getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await queryAll<UserRow>(
    `SELECT id, name, email, created_at FROM users WHERE email != 'demo@guildwire.io' ORDER BY created_at DESC`
  )

  return NextResponse.json(users)
}
