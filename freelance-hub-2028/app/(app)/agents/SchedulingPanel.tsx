'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck2, Repeat, CalendarClock, Sparkles, AlertTriangle, Loader2, Wand2, CheckCircle2,
} from 'lucide-react'
import {
  DAY_NAMES, computeRecurringNextRun, isWithinWorkingHours, nextWorkingHoursSlot,
  buildRecurringPreview, buildOncePreview, buildCalendarPreview, zonedToUtc,
  type RecurringConfig, type CalendarTriggerConfig,
} from '@/lib/scheduling'

export type ScheduleType = 'once' | 'recurring' | 'calendar' | 'smart'

export interface ScheduleState {
  scheduleType: ScheduleType | null
  onceDate: string
  onceTime: string
  frequency: RecurringConfig['frequency']
  time: string
  days: string[]
  dayOfMonth: number
  customInterval: number
  beforeAfter: CalendarTriggerConfig['beforeAfter']
  offsetMinutes: number
  eventFilter: CalendarTriggerConfig['eventFilter']
  clientName: string
  smartDescription: string
  timezone: string
}

export function defaultScheduleState(timezone: string): ScheduleState {
  return {
    scheduleType: null,
    onceDate: '', onceTime: '09:00',
    frequency: 'daily', time: '09:00', days: ['Monday'], dayOfMonth: 1, customInterval: 3,
    beforeAfter: 'before', offsetMinutes: 30, eventFilter: 'all', clientName: '',
    smartDescription: '', timezone: timezone || 'America/New_York',
  }
}

const CARD_META: { type: ScheduleType; icon: React.FC<{ size?: number; color?: string }>; label: string; desc: string; color: string; bg: string }[] = [
  { type: 'once', icon: CalendarCheck2, label: 'Run Once', desc: 'At a specific date and time', color: 'var(--accent-brand)', bg: 'rgba(var(--accent-brand-rgb),0.08)' },
  { type: 'recurring', icon: Repeat, label: 'Recurring', desc: 'Daily, weekly, or monthly', color: 'var(--accent-brand)', bg: 'rgba(var(--accent-brand-rgb),0.08)' },
  { type: 'calendar', icon: CalendarClock, label: 'Calendar Trigger', desc: 'Before or after a calendar event', color: '#CA8A04', bg: 'rgba(202,138,4,0.08)' },
  { type: 'smart', icon: Sparkles, label: 'Smart Schedule', desc: 'AI picks the best time based on your patterns', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
]

const OFFSET_OPTIONS = [
  { value: 15, label: '15 min' }, { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' }, { value: 120, label: '2 hours' }, { value: 1440, label: '1 day' },
]

const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff' }
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }

interface Props {
  value: ScheduleState
  onChange: (next: ScheduleState) => void
  googleCalendarConnected: boolean
  workStart: string
  workEnd: string
  workDays: string[]
}

export default function SchedulingPanel({ value, onChange, googleCalendarConnected, workStart, workEnd, workDays }: Props) {
  const [timezones, setTimezones] = useState<string[]>([])
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartSuggestion, setSmartSuggestion] = useState<{ frequency: RecurringConfig['frequency']; time: string; days?: string[]; dayOfMonth?: number; explanation: string } | null>(null)
  const [smartError, setSmartError] = useState(false)
  const [warningChoice, setWarningChoice] = useState<'ask' | 'accepted'>('ask')

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tzs = (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : [value.timezone]
      setTimezones(tzs)
    } catch {
      setTimezones([value.timezone])
    }
  }, [value.timezone])

  function patch(p: Partial<ScheduleState>) {
    setWarningChoice('ask')
    onChange({ ...value, ...p })
  }

  const scheduledAtIso = useMemo(() => {
    if (value.scheduleType === 'once' && value.onceDate && value.onceTime) {
      const [y, mo, d] = value.onceDate.split('-').map(Number)
      const [hh, mm] = value.onceTime.split(':').map(Number)
      return zonedToUtc(y, mo, d, hh, mm, value.timezone).toISOString()
    }
    return null
  }, [value.scheduleType, value.onceDate, value.onceTime, value.timezone])

  const recurringNextRun = useMemo(() => {
    if (value.scheduleType !== 'recurring' && value.scheduleType !== 'smart') return null
    try {
      return computeRecurringNextRun({
        frequency: value.frequency, time: value.time, days: value.days, dayOfMonth: value.dayOfMonth, customInterval: value.customInterval, timezone: value.timezone,
      })
    } catch { return null }
  }, [value.scheduleType, value.frequency, value.time, value.days, value.dayOfMonth, value.customInterval, value.timezone])

  const preview = useMemo(() => {
    if (value.scheduleType === 'once' && scheduledAtIso) return buildOncePreview(scheduledAtIso, value.timezone)
    if ((value.scheduleType === 'recurring' || value.scheduleType === 'smart') && recurringNextRun) {
      return buildRecurringPreview({ frequency: value.frequency, time: value.time, days: value.days, dayOfMonth: value.dayOfMonth, customInterval: value.customInterval, timezone: value.timezone }, recurringNextRun)
    }
    if (value.scheduleType === 'calendar') {
      return buildCalendarPreview({ beforeAfter: value.beforeAfter, offsetMinutes: value.offsetMinutes, eventFilter: value.eventFilter, clientName: value.clientName })
    }
    return null
  }, [value, scheduledAtIso, recurringNextRun])

  const checkInstant = value.scheduleType === 'once' ? scheduledAtIso : (value.scheduleType === 'recurring' || value.scheduleType === 'smart') ? recurringNextRun : null
  const outsideWorkingHours = warningChoice === 'ask' && checkInstant && !isWithinWorkingHours(checkInstant, value.timezone, workStart, workEnd, workDays)

  function moveToWorkingHours() {
    const from = value.scheduleType === 'once' ? new Date() : new Date(checkInstant!)
    const slotIso = nextWorkingHoursSlot(from, value.timezone, workStart, workDays)
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: value.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(slotIso))
    const map: Record<string, string> = {}
    for (const p of parts) map[p.type] = p.value
    if (value.scheduleType === 'once') {
      patch({ onceDate: `${map.year}-${map.month}-${map.day}`, onceTime: `${map.hour}:${map.minute}` })
    } else {
      const weekday = DAY_NAMES[new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day))).getUTCDay()]
      patch({ time: `${map.hour}:${map.minute}`, days: [weekday] })
    }
    setWarningChoice('accepted')
  }

  async function askSmartSchedule() {
    setSmartLoading(true)
    setSmartError(false)
    setSmartSuggestion(null)
    try {
      const res = await fetch('/api/agents/smart-schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: value.smartDescription }),
      })
      const data = await res.json()
      if (data.suggestion) setSmartSuggestion(data.suggestion)
      else setSmartError(true)
    } catch {
      setSmartError(true)
    } finally {
      setSmartLoading(false)
    }
  }

  function acceptSmartSuggestion() {
    if (!smartSuggestion) return
    patch({
      frequency: smartSuggestion.frequency,
      time: smartSuggestion.time,
      days: smartSuggestion.days || value.days,
      dayOfMonth: smartSuggestion.dayOfMonth || value.dayOfMonth,
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 24, borderLeft: '4px solid var(--accent-brand)', marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>When should this run?</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', margin: '0 0 18px' }}>Choose exactly when your agent springs into action</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: value.scheduleType ? 18 : 0 }}>
        {CARD_META.map(card => {
          const selected = value.scheduleType === card.type
          const Icon = card.icon
          return (
            <button key={card.type} type="button" onClick={() => patch({ scheduleType: card.type })}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                border: selected ? `1.5px solid ${card.color}` : '1.5px solid #E9EBF0', background: selected ? card.bg : '#F8FAFC', transition: 'all 0.12s',
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={card.color} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700, color: '#111827' }}>{card.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 2 }}>{card.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Run Once config */}
      {value.scheduleType === 'once' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={value.onceDate} onChange={e => patch({ onceDate: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Time</label>
            <input type="time" value={value.onceTime} onChange={e => patch({ onceTime: e.target.value })} style={inputStyle} />
          </div>
          <TimezonePicker value={value.timezone} timezones={timezones} onChange={tz => patch({ timezone: tz })} />
        </div>
      )}

      {/* Recurring config */}
      {value.scheduleType === 'recurring' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select value={value.frequency} onChange={e => patch({ frequency: e.target.value as RecurringConfig['frequency'] })} style={inputStyle}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" value={value.time} onChange={e => patch({ time: e.target.value })} style={inputStyle} />
            </div>
            {value.frequency === 'monthly' && (
              <div>
                <label style={labelStyle}>Day of month</label>
                <input type="number" min={1} max={31} value={value.dayOfMonth} onChange={e => patch({ dayOfMonth: Number(e.target.value) || 1 })} style={{ ...inputStyle, width: 70 }} />
              </div>
            )}
            {value.frequency === 'custom' && (
              <div>
                <label style={labelStyle}>Every N days</label>
                <input type="number" min={1} value={value.customInterval} onChange={e => patch({ customInterval: Number(e.target.value) || 1 })} style={{ ...inputStyle, width: 70 }} />
              </div>
            )}
            <TimezonePicker value={value.timezone} timezones={timezones} onChange={tz => patch({ timezone: tz })} />
          </div>
          {value.frequency === 'weekly' && (
            <div>
              <label style={labelStyle}>Days</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {DAY_NAMES.map(day => {
                  const on = value.days.includes(day)
                  return (
                    <button key={day} type="button" onClick={() => patch({ days: on ? value.days.filter(d => d !== day) : [...value.days, day] })}
                      style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', border: on ? '1.5px solid var(--accent-brand)' : '1.5px solid #E5E7EB', background: on ? 'rgba(var(--accent-brand-rgb),0.1)' : '#fff', color: on ? 'var(--accent-brand-hover)' : '#6B7280', fontWeight: on ? 600 : 400 }}>
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Trigger config */}
      {value.scheduleType === 'calendar' && (
        !googleCalendarConnected ? (
          <div style={{ background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#92400E', fontFamily: 'var(--font-body)' }}>
            Connect Google Calendar in <a href="/integrations" style={{ color: '#92400E', fontWeight: 700, textDecoration: 'underline' }}>Integrations</a> to use this trigger.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Trigger type</label>
              <select value={value.beforeAfter} onChange={e => patch({ beforeAfter: e.target.value as CalendarTriggerConfig['beforeAfter'] })} style={inputStyle}>
                <option value="before">Before event</option>
                <option value="after">After event</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Offset</label>
              <select value={value.offsetMinutes} onChange={e => patch({ offsetMinutes: Number(e.target.value) })} style={inputStyle}>
                {OFFSET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Event filter</label>
              <select value={value.eventFilter} onChange={e => patch({ eventFilter: e.target.value as CalendarTriggerConfig['eventFilter'] })} style={inputStyle}>
                <option value="all">All events</option>
                <option value="client">Events with specific client</option>
                <option value="meetings">Events tagged as meetings</option>
                <option value="deadlines">Events tagged as deadlines</option>
              </select>
            </div>
            {value.eventFilter === 'client' && (
              <div>
                <label style={labelStyle}>Client name</label>
                <input value={value.clientName} onChange={e => patch({ clientName: e.target.value })} placeholder="e.g. Acme Corp" style={inputStyle} />
              </div>
            )}
          </div>
        )
      )}

      {/* Smart Schedule config */}
      {value.scheduleType === 'smart' && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Describe what you want this agent to do</label>
          <textarea value={value.smartDescription} onChange={e => { patch({ smartDescription: e.target.value }); setSmartSuggestion(null); setSmartError(false) }}
            rows={3} placeholder="e.g. Remind me to follow up with clients who haven't paid"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, lineHeight: 1.6, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <button type="button" onClick={askSmartSchedule} disabled={!value.smartDescription.trim() || smartLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 600, cursor: value.smartDescription.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', opacity: value.smartDescription.trim() ? 1 : 0.5 }}>
            {smartLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={14} />}
            {smartLoading ? 'Thinking…' : 'Suggest a Schedule'}
          </button>

          {smartSuggestion && (
            <div style={{ marginTop: 14, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Sparkles size={14} color="#7C3AED" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', fontFamily: 'var(--font-body)' }}>
                  Suggested schedule: {smartSuggestion.frequency === 'weekly' && smartSuggestion.days ? `Every ${smartSuggestion.days.join(', ')}` : smartSuggestion.frequency === 'monthly' ? `Monthly on day ${smartSuggestion.dayOfMonth}` : 'Every day'} at {smartSuggestion.time}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', fontStyle: 'italic', margin: '0 0 12px', lineHeight: 1.5 }}>{smartSuggestion.explanation}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="button" onClick={acceptSmartSuggestion}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  <CheckCircle2 size={13} /> Accept This Schedule
                </button>
                <button type="button" onClick={() => setSmartSuggestion(null)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
                  Customize Instead
                </button>
              </div>
            </div>
          )}

          {smartError && !smartLoading && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6B7280', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              Couldn&apos;t generate a suggestion right now — no problem, set the time and day yourself below.
            </div>
          )}

          {(smartError || value.time) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
              <div>
                <label style={labelStyle}>Frequency</label>
                <select value={value.frequency} onChange={e => patch({ frequency: e.target.value as RecurringConfig['frequency'] })} style={inputStyle}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <input type="time" value={value.time} onChange={e => patch({ time: e.target.value })} style={inputStyle} />
              </div>
              {value.frequency === 'weekly' && (
                <div>
                  <label style={labelStyle}>Days</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {DAY_NAMES.map(day => {
                      const on = value.days.includes(day)
                      return (
                        <button key={day} type="button" onClick={() => patch({ days: on ? value.days.filter(d => d !== day) : [...value.days, day] })}
                          style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', border: on ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB', background: on ? 'rgba(124,58,237,0.08)' : '#fff', color: on ? '#6D28D9' : '#6B7280' }}>
                          {day.slice(0, 3)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <TimezonePicker value={value.timezone} timezones={timezones} onChange={tz => patch({ timezone: tz })} />
            </div>
          )}
        </div>
      )}

      {/* Live plain-English preview */}
      {preview && (
        <div style={{ background: 'rgba(var(--accent-brand-rgb),0.03)', borderLeft: '3px solid var(--accent-brand)', borderRadius: '0 8px 8px 0', padding: '9px 14px', marginBottom: outsideWorkingHours ? 12 : 0, fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          {preview}
        </div>
      )}

      {/* Working hours warning */}
      {outsideWorkingHours && checkInstant && (
        <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: '#92400E', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.55 }}>
              This will run {new Date(checkInstant).toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: value.timezone })} — outside your working hours of {workStart}–{workEnd}, {workDays.length === 5 && !workDays.includes('Saturday') ? 'Monday through Friday' : workDays.join(', ')}. Are you sure? Or would you like me to run it at your next working hours slot instead?
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, marginLeft: 26 }}>
            <button type="button" onClick={() => setWarningChoice('accepted')}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(217,119,6,0.4)', background: '#fff', color: '#92400E', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Run as scheduled
            </button>
            <button type="button" onClick={moveToWorkingHours}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Move to next working slot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TimezonePicker({ value, timezones, onChange }: { value: string; timezones: string[]; onChange: (tz: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>Timezone</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
        {!timezones.includes(value) && <option value={value}>{value}</option>}
        {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  )
}
