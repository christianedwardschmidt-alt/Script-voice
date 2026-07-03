import { NextResponse } from 'next/server'
import { restoreSeedData } from '@/lib/db'

export async function POST() {
  await restoreSeedData()
  return NextResponse.json({ ok: true })
}
