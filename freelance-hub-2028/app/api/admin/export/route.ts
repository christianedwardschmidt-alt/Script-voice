import { NextRequest, NextResponse } from 'next/server'
import { queryAll } from '@/lib/db'

interface UserRow {
  id: number
  name: string
  email: string
  created_at: string
}

function csvEscape(value: string): string {
  // Wrap in quotes if the field contains a comma, quote, or newline
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  // Auth: require ?token= matching ADMIN_SECRET env var.
  // If ADMIN_SECRET is not set, only allow from localhost/loopback.
  const secret = process.env.ADMIN_SECRET
  const providedToken = req.nextUrl.searchParams.get('token')

  if (secret) {
    if (providedToken !== secret) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  } else {
    // No secret configured — only allow localhost access
    const host = req.headers.get('host') ?? ''
    const forwarded = req.headers.get('x-forwarded-for') ?? ''
    const isLocal = host.startsWith('localhost') || host.startsWith('127.') || forwarded === ''
    if (!isLocal) {
      return new NextResponse('Set ADMIN_SECRET env var to enable remote export', { status: 401 })
    }
  }

  const users = await queryAll<UserRow>(
    `SELECT id, name, email, created_at FROM users WHERE email != 'demo@guildwire.io' ORDER BY created_at DESC`
  )

  const header = ['ID', 'Name', 'Email', 'Signed Up (UTC)']
  const rows = users.map(u => [
    csvEscape(String(u.id)),
    csvEscape(u.name),
    csvEscape(u.email),
    csvEscape(u.created_at),
  ])

  const csv = [header, ...rows].map(r => r.join(',')).join('\r\n')
  const filename = `guildwire-signups-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
