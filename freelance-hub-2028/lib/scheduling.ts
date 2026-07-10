// Framework-free scheduling math for AI Agent scheduling intelligence.
// No external timezone library — IANA offsets are derived from the built-in
// Intl.DateTimeFormat, which already ships full tz-database + DST support.

import { format } from 'date-fns'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface RecurringConfig {
  frequency: Frequency
  time: string // 'HH:MM'
  days?: string[] // weekly
  dayOfMonth?: number // monthly, 1-31
  customInterval?: number // custom: every N days
  timezone: string // IANA id
}

export interface CalendarTriggerConfig {
  beforeAfter: 'before' | 'after'
  offsetMinutes: number
  eventFilter: 'all' | 'client' | 'meetings' | 'deadlines'
  clientName?: string
}

// ── Timezone conversion (Intl-based, dependency-free) ───────────────────────

function wallClockPartsInTz(date: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(date)) if (p.type !== 'literal') map[p.type] = p.value
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day), hour: Number(map.hour), minute: Number(map.minute) }
}

function offsetMinutesAt(timeZone: string, utcInstant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(utcInstant)) if (p.type !== 'literal') map[p.type] = p.value
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second))
  return Math.round((asUtc - utcInstant.getTime()) / 60000)
}

// Given a desired wall-clock date/time in `timeZone`, return the actual UTC instant.
export function zonedToUtc(year: number, month1: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = new Date(Date.UTC(year, month1 - 1, day, hour, minute, 0))
  const off = offsetMinutesAt(timeZone, guess)
  return new Date(guess.getTime() - off * 60000)
}

function clampDayOfMonth(day: number, year: number, month1: number): number {
  const lastDay = new Date(Date.UTC(year, month1, 0)).getUTCDate()
  return Math.max(1, Math.min(day, lastDay))
}

function addDaysToYMD(y: number, mo: number, d: number, delta: number): { y: number; mo: number; d: number } {
  const dt = new Date(Date.UTC(y, mo - 1, d + delta))
  return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

function weekdayName(y: number, mo: number, d: number): string {
  return DAY_NAMES[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]
}

// ── Next-occurrence math ─────────────────────────────────────────────────────

export function computeRecurringNextRun(config: RecurringConfig, from: Date = new Date()): string {
  const [hh, mm] = (config.time || '09:00').split(':').map(Number)
  const days = config.days && config.days.length ? config.days : DAY_NAMES.slice()

  if (config.frequency === 'custom') {
    const start = wallClockPartsInTz(from, config.timezone)
    const base = zonedToUtc(start.year, start.month, start.day, hh, mm, config.timezone)
    const intervalDays = Math.max(1, config.customInterval || 1)
    if (base.getTime() > from.getTime()) return base.toISOString()
    return new Date(base.getTime() + intervalDays * 86400000).toISOString()
  }

  let { year: y, month: mo, day: d } = wallClockPartsInTz(from, config.timezone)
  for (let i = 0; i < 400; i++) {
    const matches =
      config.frequency === 'daily' ? true :
      config.frequency === 'weekly' ? days.includes(weekdayName(y, mo, d)) :
      d === clampDayOfMonth(config.dayOfMonth || 1, y, mo)
    if (matches) {
      const candidate = zonedToUtc(y, mo, d, hh, mm, config.timezone)
      if (candidate.getTime() > from.getTime()) return candidate.toISOString()
    }
    const next = addDaysToYMD(y, mo, d, 1)
    y = next.y; mo = next.mo; d = next.d
  }
  return zonedToUtc(y, mo, d, hh, mm, config.timezone).toISOString()
}

export function applyCalendarOffset(eventIso: string, cfg: Pick<CalendarTriggerConfig, 'beforeAfter' | 'offsetMinutes'>): string {
  const ms = new Date(eventIso).getTime()
  const delta = cfg.offsetMinutes * 60000
  return new Date(cfg.beforeAfter === 'before' ? ms - delta : ms + delta).toISOString()
}

// ── Working hours ────────────────────────────────────────────────────────────

export function isWithinWorkingHours(
  isoDateTime: string, timeZone: string, workStart: string, workEnd: string, workDays: string[]
): boolean {
  const parts = wallClockPartsInTz(new Date(isoDateTime), timeZone)
  const day = weekdayName(parts.year, parts.month, parts.day)
  if (!workDays.includes(day)) return false
  const minutes = parts.hour * 60 + parts.minute
  const [sh, sm] = workStart.split(':').map(Number)
  const [eh, em] = workEnd.split(':').map(Number)
  return minutes >= sh * 60 + sm && minutes <= eh * 60 + em
}

// Next working-hours slot at or after `from` — used for the "Move to Monday 9 AM" suggestion.
export function nextWorkingHoursSlot(from: Date, timeZone: string, workStart: string, workDays: string[]): string {
  const [sh, sm] = workStart.split(':').map(Number)
  let { year: y, month: mo, day: d } = wallClockPartsInTz(from, timeZone)
  for (let i = 0; i < 14; i++) {
    if (workDays.includes(weekdayName(y, mo, d))) {
      const candidate = zonedToUtc(y, mo, d, sh, sm, timeZone)
      if (candidate.getTime() > from.getTime()) return candidate.toISOString()
    }
    const next = addDaysToYMD(y, mo, d, 1)
    y = next.y; mo = next.mo; d = next.d
  }
  return zonedToUtc(y, mo, d, sh, sm, timeZone).toISOString()
}

// ── Human-readable helpers ───────────────────────────────────────────────────

export function timezoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop() || timeZone
  return `${city.replace(/_/g, ' ')} time`
}

export function relativeRunLabel(isoDateTime: string, from: Date = new Date()): string {
  const diffMs = new Date(isoDateTime).getTime() - from.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  const diffHours = Math.round(diffMs / 3600000)
  if (diffMs <= 0) return 'now'
  if (diffHours < 24) return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`
  if (diffDays === 1) return 'in 1 day'
  return `in ${diffDays} days`
}

export function buildRecurringPreview(config: RecurringConfig, nextRunIso: string): string {
  const [hh, mm] = (config.time || '09:00').split(':').map(Number)
  const timeLabel = format(new Date(2000, 0, 1, hh, mm), 'h:mm a')
  const tzLabel = timezoneLabel(config.timezone)
  const rel = relativeRunLabel(nextRunIso)
  let cadence: string
  if (config.frequency === 'daily') cadence = 'every day'
  else if (config.frequency === 'weekly') {
    const days = config.days && config.days.length ? config.days : []
    cadence = days.length ? `every ${days.join(' and ')}` : 'every week'
  } else if (config.frequency === 'monthly') cadence = `on day ${config.dayOfMonth || 1} of every month`
  else cadence = `every ${Math.max(1, config.customInterval || 1)} day${(config.customInterval || 1) === 1 ? '' : 's'}`
  return `This agent will run ${cadence} at ${timeLabel} ${tzLabel} · next run ${rel}`
}

export function buildOncePreview(scheduledAtIso: string, timeZone: string): string {
  const parts = wallClockPartsInTz(new Date(scheduledAtIso), timeZone)
  const dateLabel = format(new Date(parts.year, parts.month - 1, parts.day), 'MMMM d')
  const [hh, mm] = [parts.hour, parts.minute]
  const timeLabel = format(new Date(2000, 0, 1, hh, mm), 'h:mm a')
  const rel = relativeRunLabel(scheduledAtIso)
  return `This agent will run once on ${dateLabel} at ${timeLabel} · ${rel}`
}

const EVENT_FILTER_LABEL: Record<string, string> = {
  all: 'calendar event',
  client: 'client meeting',
  meetings: 'meeting',
  deadlines: 'deadline',
}

export function buildCalendarPreview(cfg: CalendarTriggerConfig): string {
  const offsetLabel = cfg.offsetMinutes >= 60
    ? `${cfg.offsetMinutes / 60} hour${cfg.offsetMinutes / 60 === 1 ? '' : 's'}`
    : `${cfg.offsetMinutes} min`
  const noun = EVENT_FILTER_LABEL[cfg.eventFilter] || 'calendar event'
  return `This agent will run ${offsetLabel} ${cfg.beforeAfter} every ${noun} · based on your Google Calendar`
}
