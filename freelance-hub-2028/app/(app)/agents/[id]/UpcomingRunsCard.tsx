'use client'

import React, { useEffect, useState } from 'react'
import { CalendarClock, Settings2, X } from 'lucide-react'
import SchedulingPanel, { defaultScheduleState, type ScheduleState } from '../SchedulingPanel'
import { zonedToUtc } from '@/lib/scheduling'

interface UpcomingRun {
  scheduled_for: string
}

export interface AgentScheduleFields {
  schedule_type: string | null
  scheduled_at: string | null
  recurring_config: { frequency: ScheduleState['frequency']; time: string; days?: string[]; dayOfMonth?: number; customInterval?: number; timezone: string } | null
  calendar_trigger_config: { beforeAfter: ScheduleState['beforeAfter']; offsetMinutes: number; eventFilter: ScheduleState['eventFilter']; clientName?: string } | null
  smart_schedule_description: string | null
}

function localDateTimeParts(iso: string, timeZone: string): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(new Date(iso))) if (p.type !== 'literal') map[p.type] = p.value
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` }
}

function fieldsToScheduleState(fields: AgentScheduleFields, fallbackTimezone: string): ScheduleState {
  const base = defaultScheduleState(fallbackTimezone)
  if (fields.schedule_type === 'once' && fields.scheduled_at) {
    const { date, time } = localDateTimeParts(fields.scheduled_at, fallbackTimezone)
    return { ...base, scheduleType: 'once', onceDate: date, onceTime: time }
  }
  if ((fields.schedule_type === 'recurring' || fields.schedule_type === 'smart') && fields.recurring_config) {
    const rc = fields.recurring_config
    return {
      ...base, scheduleType: fields.schedule_type as 'recurring' | 'smart',
      frequency: rc.frequency, time: rc.time, days: rc.days || base.days, dayOfMonth: rc.dayOfMonth || 1, customInterval: rc.customInterval || 1,
      timezone: rc.timezone || fallbackTimezone,
      smartDescription: fields.smart_schedule_description || '',
    }
  }
  if (fields.schedule_type === 'calendar' && fields.calendar_trigger_config) {
    const cc = fields.calendar_trigger_config
    return { ...base, scheduleType: 'calendar', beforeAfter: cc.beforeAfter, offsetMinutes: cc.offsetMinutes, eventFilter: cc.eventFilter, clientName: cc.clientName || '' }
  }
  return base
}

function formatRun(iso: string): { dateLabel: string; timeLabel: string; isSoon: boolean } {
  const d = new Date(iso)
  const diffMs = d.getTime() - Date.now()
  const isSoon = diffMs > 0 && diffMs < 86400000
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  return { dateLabel, timeLabel, isSoon }
}

export default function UpcomingRunsCard({
  agentId, scheduleFields, timezone, onScheduleUpdated,
}: {
  agentId: string
  scheduleFields: AgentScheduleFields
  timezone: string
  onScheduleUpdated: () => void
}) {
  const [runs, setRuns] = useState<UpcomingRun[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editState, setEditState] = useState<ScheduleState>(() => fieldsToScheduleState(scheduleFields, timezone))
  const [saving, setSaving] = useState(false)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '18:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] })

  useEffect(() => {
    fetch(`/api/agents/${agentId}/upcoming`).then(r => r.json()).then(data => {
      if (Array.isArray(data.runs)) setRuns(data.runs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [agentId])

  function openEdit() {
    setEditState(fieldsToScheduleState(scheduleFields, timezone))
    fetch('/api/settings').then(r => r.json()).then(s => {
      setWorkHours({ start: s.work_start || '09:00', end: s.work_end || '18:00', days: s.work_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] })
      setGoogleCalendarConnected(!!s.google_calendar_connected)
    }).catch(() => {})
    setEditing(true)
  }

  async function saveSchedule() {
    setSaving(true)
    const s = editState
    let payload: Record<string, unknown>
    if (s.scheduleType === 'once') {
      const [y, mo, d] = s.onceDate.split('-').map(Number)
      const [hh, mm] = s.onceTime.split(':').map(Number)
      payload = { schedule_type: 'once', scheduled_at: zonedToUtc(y, mo, d, hh, mm, s.timezone).toISOString(), recurring_config: null, calendar_trigger_config: null, smart_schedule_description: null }
    } else if (s.scheduleType === 'recurring' || s.scheduleType === 'smart') {
      payload = {
        schedule_type: s.scheduleType, scheduled_at: null,
        recurring_config: { frequency: s.frequency, time: s.time, days: s.days, dayOfMonth: s.dayOfMonth, customInterval: s.customInterval, timezone: s.timezone },
        calendar_trigger_config: null, smart_schedule_description: s.scheduleType === 'smart' ? s.smartDescription : null,
      }
    } else if (s.scheduleType === 'calendar') {
      payload = {
        schedule_type: 'calendar', scheduled_at: null, recurring_config: null,
        calendar_trigger_config: { beforeAfter: s.beforeAfter, offsetMinutes: s.offsetMinutes, eventFilter: s.eventFilter, clientName: s.clientName }, smart_schedule_description: null,
      }
    } else {
      payload = { schedule_type: null, scheduled_at: null, recurring_config: null, calendar_trigger_config: null, smart_schedule_description: null }
    }
    await fetch(`/api/agents/${agentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
    setSaving(false)
    setEditing(false)
    setLoading(true)
    fetch(`/api/agents/${agentId}/upcoming`).then(r => r.json()).then(data => { if (Array.isArray(data.runs)) setRuns(data.runs) }).finally(() => setLoading(false))
    onScheduleUpdated()
  }

  if (!scheduleFields.schedule_type && !editing) return null

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(var(--accent-brand-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarClock size={15} color="var(--accent-brand)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Upcoming Runs</h3>
        </div>
        <button onClick={openEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <Settings2 size={13} /> Edit Schedule
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)', padding: '8px 0' }}>Loading…</div>
      ) : runs.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)', padding: '8px 0' }}>No upcoming runs scheduled.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {runs.map((run, i) => {
            const { dateLabel, timeLabel, isSoon } = formatRun(run.scheduled_for)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10,
                background: isSoon ? 'rgba(202,138,4,0.08)' : 'var(--bg-2)', border: isSoon ? '1px solid rgba(202,138,4,0.3)' : '1px solid transparent',
              }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: isSoon ? '#92400E' : 'var(--text-2)', fontWeight: isSoon ? 700 : 500 }}>
                  {isSoon ? `Running tomorrow at ${timeLabel}` : `${dateLabel} at ${timeLabel}`}
                </span>
                {isSoon && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#CA8A04', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Next up</span>}
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, maxWidth: 620, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 24, position: 'relative' }}>
            <button onClick={() => setEditing(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={18} color="#9CA3AF" />
            </button>
            <SchedulingPanel
              value={editState}
              onChange={setEditState}
              googleCalendarConnected={googleCalendarConnected}
              workStart={workHours.start}
              workEnd={workHours.end}
              workDays={workHours.days}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button onClick={() => setEditing(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={saveSchedule} disabled={saving || !editState.scheduleType}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--accent-brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
