import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) return NextResponse.json({ ok: false, error: 'TURSO_DATABASE_URL is not set' }, { status: 500 })
  if (!authToken) return NextResponse.json({ ok: false, error: 'TURSO_AUTH_TOKEN is not set' }, { status: 500 })

  try {
    const client = createClient({ url, authToken })
    await client.execute('SELECT 1')
    return NextResponse.json({ ok: true, message: 'Turso connection successful', url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
