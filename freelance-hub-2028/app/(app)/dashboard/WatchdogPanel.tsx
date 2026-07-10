'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react'

interface WatchdogRun {
  id: number
  run_date: string
  items_generated: number
  items_shown: number
  items_resolved: number
  items_dismissed: number
  panel_dismissed: number
}

interface WatchdogItem {
  id: number
  category: string
  priority_score: number
  priority_color: 'red' | 'amber' | 'green'
  alert_text: string
  action_type: 'send_reminder' | 'draft_checkin' | 'follow_up' | 'view_details'
  action_data: Record<string, unknown>
  resolved: number
  dismissed: number
  resolved_at: string | null
}

const DOT_COLORS: Record<string, string> = { red: '#EF4444', amber: '#CA8A04', green: '#16A34A' }

const DETAIL_LABELS: Record<string, string> = {
  invoiceId: 'Invoice', client: 'Client', amount: 'Amount', daysOverdue: 'Days overdue',
  templateId: 'Template', clientId: 'Client', company: 'Company', daysSinceContact: 'Days since contact',
  proposalId: 'Proposal', title: 'Title', viewCount: 'Times viewed', taskId: 'Task', agentId: 'Agent',
  runId: 'Run', count: 'Count', jobId: 'Job', revenueThisMonth: 'Revenue this month',
  revenueLastMonth: 'Revenue last month', pctChange: 'Change', goal: 'Annual goal', quarter: 'Quarter',
  daysUntil: 'Days until due', estimate: 'Estimated payment', postId: 'Post', author: 'Author',
}
const MONEY_KEYS = new Set(['amount', 'revenueThisMonth', 'revenueLastMonth', 'goal', 'estimate'])
const SKIP_KEYS = new Set(['actionLabel'])

function formatDetailValue(key: string, value: unknown): string {
  if (MONEY_KEYS.has(key) && typeof value === 'number') return `$${value.toLocaleString()}`
  if (key === 'pctChange' && typeof value === 'number') return `${value > 0 ? '+' : ''}${value}%`
  return String(value)
}

function defaultReminderMessage(data: Record<string, unknown>): string {
  const amt = typeof data.amount === 'number' ? `$${data.amount.toLocaleString()}` : 'the amount due'
  const days = data.daysOverdue as number | undefined
  return `Hi ${data.client || 'there'}, just a friendly reminder that Invoice ${data.invoiceId || ''} for ${amt} is ${days ? `now ${days} day${days === 1 ? '' : 's'} past due` : 'still outstanding'}. Let me know if you have any questions — happy to help however I can.`
}

function defaultCheckinMessage(data: Record<string, unknown>): string {
  return `Hi ${data.client || 'there'}, it's been a little while since we last connected${data.company ? ` on things over at ${data.company}` : ''} — wanted to check in and see how everything is going. Let me know if there's anything I can help with, or if it's a good time to catch up.`
}

function followUpContext(data: Record<string, unknown>): string {
  const client = (data.client as string) || 'the client'
  const title = (data.title as string) || 'the proposal'
  const viewCount = data.viewCount as number | undefined
  return `Help me follow up with ${client} about the "${title}" proposal${viewCount ? ` — they've viewed it ${viewCount} times but haven't responded` : ' that has been sitting without a response'}.`
}

function WatchdogDogIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 5.5L2 2.2L6.4 4.5Z" fill="#16A34A" />
      <circle cx="6.5" cy="8.5" r="4" fill="#16A34A" />
      <ellipse cx="11.5" cy="15" rx="6.8" ry="5.2" fill="#16A34A" />
      <circle cx="5.3" cy="8" r="0.7" fill="#0A1A0F" />
      <path
        d="M17 15.5 Q22.5 13 21.5 19"
        stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" fill="none"
        className="watchdog-tail"
        style={{ transformOrigin: '17px 15.5px' }}
      />
    </svg>
  )
}

export default function WatchdogPanel({ userName, standardHeader }: { userName: string; standardHeader: React.ReactNode }) {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [run, setRun] = useState<WatchdogRun | null>(null)
  const [items, setItems] = useState<WatchdogItem[]>([])
  const [dismissedToday, setDismissedToday] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [pillOpen, setPillOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState<{ item: WatchdogItem; kind: 'reminder' | 'checkin' } | null>(null)
  const [composeMessage, setComposeMessage] = useState('')
  const [composeSending, setComposeSending] = useState(false)

  useEffect(() => {
    fetch('/api/watchdog/today')
      .then(r => r.json())
      .then((d: { run: WatchdogRun | null; items: WatchdogItem[] }) => {
        setRun(d.run)
        setItems(d.items || [])
        setDismissedToday(!!d.run?.panel_dismissed)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const hour = new Date().getHours()
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const unresolvedCount = items.filter(i => !i.resolved).length
  const allCaughtUp = items.length === 0 || items.every(i => i.resolved)
  const inMorningWindow = hour >= 6 && hour < 11
  const showFullPanel = loaded && !!run && inMorningWindow && !dismissedToday
  const showPill = loaded && !!run && !showFullPanel && (hour >= 11 || dismissedToday) && unresolvedCount > 0

  function markResolvedLocally(id: number) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, resolved: 1 } : i)))
  }

  async function handleDismissPanel() {
    setDismissedToday(true)
    fetch('/api/watchdog/dismiss-panel', { method: 'POST' }).catch(() => {})
  }

  function openCompose(item: WatchdogItem, kind: 'reminder' | 'checkin') {
    setComposeMessage(kind === 'reminder' ? defaultReminderMessage(item.action_data) : defaultCheckinMessage(item.action_data))
    setComposeOpen({ item, kind })
  }

  function closeCompose() {
    if (composeSending) return
    setComposeOpen(null)
  }

  async function handleComposeSend() {
    if (!composeOpen) return
    setComposeSending(true)
    const endpoint = composeOpen.kind === 'reminder' ? 'send-reminder' : 'send-checkin'
    try {
      await fetch(`/api/watchdog/items/${composeOpen.item.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: composeMessage }),
      })
      markResolvedLocally(composeOpen.item.id)
      setComposeOpen(null)
    } catch {
      // leave slide-over open so the member can retry
    } finally {
      setComposeSending(false)
    }
  }

  function handleFollowUp(item: WatchdogItem) {
    markResolvedLocally(item.id)
    fetch(`/api/watchdog/items/${item.id}/resolve`, { method: 'POST' }).catch(() => {})
    router.push(`/ai-assistant?q=${encodeURIComponent(followUpContext(item.action_data))}`)
  }

  function handleViewDetails(item: WatchdogItem) {
    setExpandedId(prev => (prev === item.id ? null : item.id))
    if (!item.resolved) {
      markResolvedLocally(item.id)
      fetch(`/api/watchdog/items/${item.id}/resolve`, { method: 'POST' }).catch(() => {})
    }
  }

  function handleAction(item: WatchdogItem) {
    if (item.action_type === 'send_reminder') openCompose(item, 'reminder')
    else if (item.action_type === 'draft_checkin') openCompose(item, 'checkin')
    else if (item.action_type === 'follow_up') handleFollowUp(item)
    else handleViewDetails(item)
  }

  function actionLabel(item: WatchdogItem): string {
    return (item.action_data.actionLabel as string) || 'View Details'
  }

  function renderItem(item: WatchdogItem, idx: number) {
    const isResolved = !!item.resolved
    return (
      <div key={item.id}>
        <div
          className="watchdog-item-row"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
            borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', background: DOT_COLORS[item.priority_color] || '#CA8A04', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
                color: isResolved ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)',
                textDecoration: isResolved ? 'line-through' : 'none',
              }}
            >
              {item.alert_text}
            </div>
            {expandedId === item.id && (
              <div style={{
                marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px 16px',
              }}>
                {Object.entries(item.action_data).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: 2, fontFamily: 'var(--font-body)' }}>
                      {DETAIL_LABELS[k] || k}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}>
                      {formatDetailValue(k, v)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, paddingTop: 1 }}>
            {isResolved ? (
              <span className="watchdog-check-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(22,163,74,0.15)' }}>
                <Check size={13} color="#16A34A" strokeWidth={3} />
              </span>
            ) : (
              <button
                className="watchdog-action-btn"
                onClick={() => handleAction(item)}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, borderRadius: 20,
                  padding: '4px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {actionLabel(item)}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const panelInner = (
    <div className="watchdog-panel-in" style={{ background: '#0A1A0F', borderRadius: 20, padding: '28px 32px', marginBottom: 24, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: allCaughtUp ? 4 : 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WatchdogDogIcon />
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              GuildWire Watchdog
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {dateLabel} · checked your business overnight
            </div>
          </div>
        </div>
        {!allCaughtUp && (
          <button
            className="watchdog-dismiss-link"
            onClick={handleDismissPanel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: 0 }}
          >
            Dismiss
          </button>
        )}
      </div>

      {allCaughtUp ? (
        <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
          <CheckCircle size={40} color="#16A34A" strokeWidth={1.5} style={{ opacity: 0.85, marginBottom: 14 }} />
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            You&apos;re all caught up
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            The Watchdog will check in again tomorrow morning. Have a great day, {userName}.
          </div>
        </div>
      ) : (
        <div>{items.map((item, idx) => renderItem(item, idx))}</div>
      )}

      <div style={{ textAlign: 'right', marginTop: allCaughtUp ? 18 : 6 }}>
        <a
          href="/dashboard/history"
          className="watchdog-dismiss-link"
          style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
        >
          View Watchdog History →
        </a>
      </div>
    </div>
  )

  return (
    <>
      <style jsx>{`
        @keyframes watchdog-tail-wag { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(22deg); } }
        @keyframes watchdog-panel-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes watchdog-row-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes watchdog-check-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes watchdog-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes watchdog-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        :global(.watchdog-tail) { animation: watchdog-tail-wag 0.7s ease-in-out infinite; }
        :global(.watchdog-panel-in) { animation: watchdog-panel-in 0.3s ease; }
        :global(.watchdog-item-row) { animation: watchdog-row-in 0.25s ease; }
        :global(.watchdog-check-badge) { animation: watchdog-check-pop 0.35s ease; }
        :global(.watchdog-action-btn:hover) { background: rgba(255,255,255,0.08) !important; }
        :global(.watchdog-dismiss-link:hover) { color: rgba(255,255,255,0.6) !important; }
        :global(.watchdog-pill-btn:hover) { background: #0d2415 !important; }
      `}</style>

      {showFullPanel ? panelInner : (
        <div>
          {showPill && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="watchdog-pill-btn"
                  onClick={() => setPillOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, background: '#0A1A0F', color: 'white',
                    border: 'none', borderRadius: 20, padding: '7px 14px 7px 10px', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                  }}
                >
                  <WatchdogDogIcon size={16} />
                  {unresolvedCount} from the Watchdog
                  {pillOpen ? <ChevronUp size={13} style={{ opacity: 0.6 }} /> : <ChevronDown size={13} style={{ opacity: 0.6 }} />}
                </button>
              </div>
              {pillOpen && (
                <div className="watchdog-panel-in" style={{ background: '#0A1A0F', borderRadius: 16, padding: '6px 22px', marginTop: 10 }}>
                  {items.map((item, idx) => renderItem(item, idx))}
                </div>
              )}
            </div>
          )}
          {standardHeader}
        </div>
      )}

      {composeOpen && (
        <>
          <div
            onClick={closeCompose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,26,15,0.5)', zIndex: 1000, animation: 'watchdog-overlay-in 0.15s ease' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: 420, maxWidth: '92vw',
            background: 'white', zIndex: 1001, boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
            animation: 'watchdog-slide-in 0.22s ease', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {composeOpen.kind === 'reminder' ? 'Send Payment Reminder' : 'Send Check-in'}
              </span>
              <button onClick={closeCompose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,17,23,0.4)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>To</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#111827', marginBottom: 18 }}>
                {String(composeOpen.item.action_data.client || 'Client')}
              </div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Message
              </label>
              <textarea
                value={composeMessage}
                onChange={e => setComposeMessage(e.target.value)}
                rows={8}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #E5E7EB',
                  fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
              <button
                onClick={closeCompose}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleComposeSend}
                disabled={composeSending}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: '#16A34A',
                  color: 'white', fontSize: 13, fontWeight: 600, cursor: composeSending ? 'default' : 'pointer',
                  opacity: composeSending ? 0.6 : 1, fontFamily: 'var(--font-body)',
                }}
              >
                {composeSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
