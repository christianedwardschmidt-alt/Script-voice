import { NextResponse } from 'next/server'
import { restoreSeedData } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await restoreSeedData(user.id)
  return NextResponse.json({ ok: true })
}
