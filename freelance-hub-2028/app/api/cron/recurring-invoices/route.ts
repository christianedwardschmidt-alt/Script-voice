import { NextRequest, NextResponse } from 'next/server'
import { runDailyRecurringInvoiceJob } from '@/lib/recurringInvoices'

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await runDailyRecurringInvoiceJob()
  return NextResponse.json({ ranAt: new Date().toISOString(), ...result })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
