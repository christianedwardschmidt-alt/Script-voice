'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'

interface HistoryItem {
  id: number
  watchdog_run_id: number
  category: string
  priority_color: 'red' | 'amber' | 'green'
  alert_text: string
  action_type: string
  resolved: number
  dismissed: number
}

interface HistoryRun {
  id: number
  run_date: string
  items_generated: number
  items_shown: number
  items_resolved: number
  items_dismissed: number
  items: HistoryItem[]
}

const DOT_COLORS: Record<string, string> = { red: '#EF4444', amber: '#CA8A04', green: '#16A34A' }
const card = { background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }

function formatRunDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function WatchdogHistoryPage() {
  const [runs, setRuns] = useState<HistoryRun[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/watchdog/history')
      .then(r => r.json())
      .then((d: { runs: HistoryRun[] }) => setRuns(d.runs || []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const totalFlagged = runs.reduce((sum, r) => sum + r.items_shown, 0)
  const totalResolved = runs.reduce((sum, r) => sum + r.items.filter(i => i.resolved).length, 0)

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <a
        href="/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </a>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            Watchdog History
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            Every morning briefing from the last 90 days — what was flagged, and what you did about it.
          </p>
        </div>
        {loaded && runs.length > 0 && (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827' }}>{totalFlagged}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#9CA3AF' }}>items flagged</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: 'var(--accent-brand)' }}>{totalResolved}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#9CA3AF' }}>resolved</div>
            </div>
          </div>
        )}
      </div>

      {!loaded ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', fontFamily: 'var(--font-body)', color: '#9CA3AF', fontSize: 14 }}>
          Loading history…
        </div>
      ) : runs.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No history yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9CA3AF' }}>
            The Watchdog runs every night at 2 AM. Check back after your first morning briefing.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {runs.map(run => {
            const resolvedCount = run.items.filter(i => i.resolved).length
            return (
              <div key={run.id} style={{ ...card, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: run.items.length > 0 ? 14 : 0, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {formatRunDate(run.run_date)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#9CA3AF' }}>
                    {run.items_shown === 0
                      ? 'Nothing needed your attention'
                      : `${resolvedCount} of ${run.items_shown} resolved`}
                  </div>
                </div>
                {run.items.length > 0 && (
                  <div>
                    {run.items.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
                          borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6',
                        }}
                      >
                        <span style={{ width: 7, height: 7, marginTop: 5, borderRadius: '50%', background: DOT_COLORS[item.priority_color] || '#CA8A04', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5, color: item.resolved ? '#9CA3AF' : '#374151', textDecoration: item.resolved ? 'line-through' : 'none' }}>
                          {item.alert_text}
                        </div>
                        {item.resolved ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--accent-brand)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                            <Check size={11} strokeWidth={3} /> Resolved
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#CA8A04', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                            Not addressed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
