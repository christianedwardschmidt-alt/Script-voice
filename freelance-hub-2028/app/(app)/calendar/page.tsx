'use client'

import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Trash2 } from 'lucide-react'

interface CalEvent {
  id: number
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  client: string | null
  description: string
  color: string
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  meeting:  { label: 'Meeting',  color: '#5b5fcf', bg: 'rgba(91,95,207,0.1)'  },
  deadline: { label: 'Deadline', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  task:     { label: 'Task',     color: '#00b857', bg: 'rgba(0,184,87,0.1)'   },
  personal: { label: 'Personal', color: '#64748b', bg: 'rgba(100,116,139,0.1)'},
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
}

const emptyForm = { title: '', date: '', startTime: '', endTime: '', type: 'meeting', client: '', description: '' }

export default function CalendarPage() {
  const today = useMemo(() => new Date(), [])
  const [view, setView]         = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents]     = useState<CalEvent[]>([])
  const [selected, setSelected] = useState<string>(fmt(today))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...emptyForm, date: fmt(today) })
  const [saving, setSaving]     = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const mk = monthKey(view)
  useEffect(() => {
    fetch(`/api/events?month=${mk}`).then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : []))
  }, [mk])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [events])

  // Desktop grid cells
  const firstDow = view.getDay()
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Mobile: 7 pills for the week containing `selected`
  const weekDays = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    return Array.from({ length: 7 }, (_, i) => new Date(y, m - 1, d - dow + i))
  }, [selected])

  function prevWeek() {
    const [y, m, d] = selected.split('-').map(Number)
    const prev = new Date(y, m - 1, d - 7)
    setSelected(fmt(prev))
    setView(new Date(prev.getFullYear(), prev.getMonth(), 1))
  }
  function nextWeek() {
    const [y, m, d] = selected.split('-').map(Number)
    const next = new Date(y, m - 1, d + 7)
    setSelected(fmt(next))
    setView(new Date(next.getFullYear(), next.getMonth(), 1))
  }
  function prevMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1)) }
  function nextMonth() { setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1)) }

  const selectedEvents = eventsByDate[selected] ?? []
  const todayStr = fmt(today)

  async function addEvent() {
    if (!form.title || !form.date) return
    setSaving(true)
    const meta = TYPE_META[form.type]
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, color: meta.color }),
    })
    const created = await res.json()
    setEvents(prev => [...prev, created])
    setSelected(form.date)
    setForm({ ...emptyForm, date: form.date })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // Shared form fields used in both mobile modal and desktop panel
  const formFields = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
          style={{ padding: '9px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
        <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
          style={{ padding: '9px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
        {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input placeholder="Client (optional)" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <textarea placeholder="Notes (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
      <button onClick={addEvent} disabled={!form.title || !form.date || saving} className="btn-primary" style={{ fontSize: 13, width: '100%', justifyContent: 'center' }}>
        {saving ? 'Saving…' : 'Add Event'}
      </button>
    </div>
  )

  if (isMobile) {
    return (
      <div className="page-pad" style={{ padding: '22px 16px 100px', background: 'var(--bg)', minHeight: '100dvh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 3, fontSize: 10 }}>SCHEDULE</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)', lineHeight: 1 }}>Calendar</h1>
          </div>
          <button onClick={() => { setShowForm(true); setForm({ ...emptyForm, date: selected }) }} className="btn-primary" style={{ fontSize: 12 }}>
            <Plus size={13} /> New Event
          </button>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-2)' }}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </span>
          <button
            onClick={() => { setView(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(todayStr) }}
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', background: 'rgba(0,184,87,0.08)', border: '1px solid rgba(0,184,87,0.2)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Today
          </button>
          <button onClick={nextMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-2)' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Week pill strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <button onClick={prevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
            <ChevronLeft size={14} />
          </button>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {weekDays.map(dt => {
              const dateStr = fmt(dt)
              const isToday = dateStr === todayStr
              const isSel = dateStr === selected
              const hasDot = (eventsByDate[dateStr] ?? []).length > 0
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 4px', borderRadius: 10,
                    background: isSel ? '#00b857' : isToday ? 'rgba(0,184,87,0.1)' : 'var(--card)',
                    border: isSel ? '1.5px solid #00b857' : isToday ? '1.5px solid rgba(0,184,87,0.3)' : '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3px', color: isSel ? 'rgba(255,255,255,0.8)' : 'var(--text-3)', textTransform: 'uppercase' }}>
                    {DAYS[dt.getDay()].slice(0, 2)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isSel ? '#fff' : isToday ? 'var(--green)' : 'var(--text)' }}>
                    {dt.getDate()}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: hasDot ? (isSel ? 'rgba(255,255,255,0.7)' : '#00b857') : 'transparent' }} />
                </button>
              )
            })}
          </div>
          <button onClick={nextWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Full month mini-grid */}
        <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 12px', marginBottom: 20 }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'center', paddingBottom: 4 }}>
                {d.slice(0, 1)}
              </div>
            ))}
          </div>
          {/* Grid cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`b-${i}`} style={{ height: 32 }} />
              const dateStr = `${view.getFullYear()}-${String(view.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isToday = dateStr === todayStr
              const isSel = dateStr === selected
              const hasDot = (eventsByDate[dateStr] ?? []).length > 0
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  style={{
                    height: 32, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                    background: isSel ? '#00b857' : isToday ? 'rgba(0,184,87,0.1)' : 'transparent',
                    border: isSel ? 'none' : isToday ? '1.5px solid rgba(0,184,87,0.3)' : 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: isSel || isToday ? 700 : 400, color: isSel ? '#fff' : isToday ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>
                    {day}
                  </span>
                  {hasDot && (
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : '#00b857' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
            {(() => {
              const [y, m, d] = selected.split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            })()}
            {selected === todayStr && (
              <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: 'var(--green)', background: 'rgba(0,184,87,0.1)', border: '1px solid rgba(0,184,87,0.2)', borderRadius: 99, padding: '1px 7px' }}>Today</span>
            )}
          </div>
        </div>

        {selectedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>No events.<br />Tap <b>New Event</b> to add one.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedEvents.map(ev => {
              const meta = TYPE_META[ev.type] ?? TYPE_META.meeting
              return (
                <div key={ev.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${ev.color}`, borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', marginBottom: 6 }}>{ev.title}</div>
                      {(ev.startTime || ev.endTime) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                          <Clock size={11} />{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                        </div>
                      )}
                      {ev.client && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                          <User size={11} />{ev.client}
                        </div>
                      )}
                      {ev.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 5 }}>{ev.description}</div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 4, padding: '2px 7px' }}>{meta.label.toUpperCase()}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Event bottom-sheet modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }} onClick={() => setShowForm(false)}>
            <div style={{ background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxHeight: '90dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>New Event</span>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}><X size={18} /></button>
              </div>
              {formFields}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Desktop layout ───────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

      {/* Calendar main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 24px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>SCHEDULE</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)', lineHeight: 1 }}>Calendar</h1>
          </div>
          <button onClick={() => { setShowForm(true); setForm({ ...emptyForm, date: selected }) }} className="btn-primary" style={{ fontSize: 12 }}>
            <Plus size={13} /> New Event
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button onClick={prevMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-2)' }}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text)', minWidth: 160, textAlign: 'center' }}>
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </span>
          <button onClick={nextMonth} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-2)' }}>
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => { setView(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(todayStr) }}
            style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, color: 'var(--green)', background: 'rgba(0,184,87,0.08)', border: '1px solid rgba(0,184,87,0.2)', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1, flexShrink: 0 }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'center', padding: '0 0 8px' }}>{d}</div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 2, paddingBottom: 24, minHeight: 0 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 8 }} />
            const dateStr = `${view.getFullYear()}-${String(view.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayEvents = eventsByDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selected
            return (
              <div
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                style={{
                  background: isSelected ? 'rgba(0,184,87,0.06)' : 'var(--card)',
                  border: isSelected ? '1.5px solid rgba(0,184,87,0.3)' : '1px solid var(--border)',
                  borderRadius: 9, padding: '8px 9px', cursor: 'pointer', overflow: 'hidden',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: '50%', marginBottom: 5,
                  background: isToday ? '#00b857' : 'transparent',
                  color: isToday ? '#fff' : isSelected ? 'var(--green)' : 'var(--text)',
                  fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{
                      fontSize: 10.5, fontWeight: 500, lineHeight: 1.3, color: ev.color,
                      background: TYPE_META[ev.type]?.bg ?? 'rgba(0,0,0,0.05)',
                      borderRadius: 4, padding: '1px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ev.startTime ? ev.startTime.slice(0,5)+' ' : ''}{ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 5 }}>+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="cal-event-panel" style={{ width: 300, background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>

        {showForm && (
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(0,184,87,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>New Event</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  style={{ padding: '7px 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  style={{ padding: '7px 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input placeholder="Client (optional)" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
              <textarea placeholder="Notes (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
              <button onClick={addEvent} disabled={!form.title || !form.date || saving} className="btn-primary" style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}>
                {saving ? 'Saving…' : 'Add Event'}
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '18px 18px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>SELECTED DAY</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text)' }}>
            {(() => {
              const [y, m, d] = selected.split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            })()}
          </div>
          {selected === todayStr && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', background: 'rgba(0,184,87,0.1)', border: '1px solid rgba(0,184,87,0.2)', borderRadius: 99, padding: '1px 8px', marginTop: 5, display: 'inline-block' }}>Today</span>
          )}
        </div>

        <div style={{ flex: 1, padding: '12px 18px 24px', overflowY: 'auto' }}>
          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>No events<br />Click a date to select, or add a new event.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedEvents.map(ev => {
                const meta = TYPE_META[ev.type] ?? TYPE_META.meeting
                return (
                  <div key={ev.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `3px solid ${ev.color}`, borderRadius: 9, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text)', lineHeight: 1.3, marginBottom: 5 }}>{ev.title}</div>
                        {(ev.startTime || ev.endTime) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>
                            <Clock size={10} />{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                          </div>
                        )}
                        {ev.client && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>
                            <User size={10} />{ev.client}
                          </div>
                        )}
                        {ev.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, marginTop: 5 }}>{ev.description}</div>
                        )}
                        <div style={{ marginTop: 7 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 4, padding: '1px 6px' }}>{meta.label.toUpperCase()}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
