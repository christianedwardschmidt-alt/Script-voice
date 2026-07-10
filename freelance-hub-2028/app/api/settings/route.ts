import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { DEFAULT_PIPELINE_STAGES } from '@/lib/db'
import { getUser } from '@/lib/auth'

const DEFAULT_STAGES = JSON.parse(DEFAULT_PIPELINE_STAGES)
const DEFAULT_WORK_DAYS = JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])

function deserialize(row: Record<string, unknown>) {
  return {
    ...row,
    notifications: !!row.notifications,
    twoFactor: !!row.twoFactor,
    darkMode: !!row.darkMode,
    invoiceAutoSend: !!row.invoiceAutoSend,
    weeklyDigest: !!row.weeklyDigest,
    workspaceName: row.workspaceName ?? 'My Studio',
    pipeline_stages: row.pipeline_stages
      ? JSON.parse(row.pipeline_stages as string)
      : DEFAULT_STAGES,
    work_start: row.work_start ?? '09:00',
    work_end: row.work_end ?? '18:00',
    work_days: row.work_days ? JSON.parse(row.work_days as string) : JSON.parse(DEFAULT_WORK_DAYS),
    google_calendar_connected: !!row.google_calendar_connected,
  }
}

const defaults = {
  notifications: true, twoFactor: false, darkMode: false,
  invoiceAutoSend: true, weeklyDigest: true, workspaceName: 'My Studio',
  pipeline_stages: DEFAULT_STAGES,
  work_start: '09:00', work_end: '18:00', work_days: JSON.parse(DEFAULT_WORK_DAYS),
  google_calendar_connected: false,
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(row ? deserialize(row) : defaults)
}

interface SettingsRow {
  notifications: number; twoFactor: number; darkMode: number;
  invoiceAutoSend: number; weeklyDigest: number; workspaceName: string; pipeline_stages: string;
  work_start: string; work_end: string; work_days: string; google_calendar_connected: number;
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await queryOne<SettingsRow>(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  const body = await request.json()

  const next: SettingsRow = existing
    ? { ...existing }
    : {
        notifications: 1, twoFactor: 0, darkMode: 0, invoiceAutoSend: 1, weeklyDigest: 1, workspaceName: 'My Studio', pipeline_stages: DEFAULT_PIPELINE_STAGES,
        work_start: '09:00', work_end: '18:00', work_days: DEFAULT_WORK_DAYS, google_calendar_connected: 0,
      }

  const boolFields = ['notifications', 'twoFactor', 'darkMode', 'invoiceAutoSend', 'weeklyDigest'] as const
  for (const f of boolFields) if (body[f] !== undefined) (next as unknown as Record<string, number>)[f] = body[f] ? 1 : 0
  if (body.workspaceName !== undefined) next.workspaceName = body.workspaceName
  if (body.pipeline_stages !== undefined) next.pipeline_stages = JSON.stringify(body.pipeline_stages)
  if (body.work_start !== undefined) next.work_start = body.work_start
  if (body.work_end !== undefined) next.work_end = body.work_end
  if (body.work_days !== undefined) next.work_days = JSON.stringify(body.work_days)
  if (body.google_calendar_connected !== undefined) next.google_calendar_connected = body.google_calendar_connected ? 1 : 0

  if (existing) {
    await execute(
      `UPDATE settings SET notifications=?, twoFactor=?, darkMode=?, invoiceAutoSend=?, weeklyDigest=?, workspaceName=?, pipeline_stages=?, work_start=?, work_end=?, work_days=?, google_calendar_connected=? WHERE user_id=?`,
      [next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName, next.pipeline_stages, next.work_start, next.work_end, next.work_days, next.google_calendar_connected, user.id]
    )
  } else {
    await execute(
      `INSERT INTO settings (user_id,notifications,twoFactor,darkMode,invoiceAutoSend,weeklyDigest,workspaceName,pipeline_stages,work_start,work_end,work_days,google_calendar_connected) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [user.id, next.notifications, next.twoFactor, next.darkMode, next.invoiceAutoSend, next.weeklyDigest, next.workspaceName, next.pipeline_stages, next.work_start, next.work_end, next.work_days, next.google_calendar_connected]
    )
  }

  const row = await queryOne(`SELECT * FROM settings WHERE user_id = ?`, [user.id])
  return NextResponse.json(deserialize(row!))
}
