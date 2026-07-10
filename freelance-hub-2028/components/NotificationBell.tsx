'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertCircle, RefreshCw, DollarSign, PauseCircle, CheckCircle } from 'lucide-react'

interface Notif {
  id: number
  type: string
  title: string
  body: string
  href: string
  read: boolean
  meta: { templateId?: number; invoiceId?: string; canPause?: boolean }
  created_at: string
}

const TYPE_STYLE: Record<string, { Icon: React.ElementType; color: string }> = {
  recurring_invoice_presend:     { Icon: Bell,        color: '#D97706' },
  recurring_invoice_sent:        { Icon: RefreshCw,   color: '#16A34A' },
  recurring_invoice_needs_amount:{ Icon: DollarSign,  color: '#2563EB' },
  recurring_invoice_failed:      { Icon: AlertCircle, color: '#DC2626' },
  recurring_invoice_autopaused:  { Icon: AlertCircle, color: '#DC2626' },
}
const DEFAULT_STYLE = { Icon: Bell, color: '#6B7280' }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [pausedIds, setPausedIds] = useState<Set<number>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const load = () => {
    fetch('/api/notifications').then(r => r.json()).then(d => {
      setNotifs(Array.isArray(d.notifications) ? d.notifications : [])
      setUnread(typeof d.unread === 'number' ? d.unread : 0)
    }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) { document.addEventListener('mousedown', onClickOutside); load() }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function go(href: string, id: number) {
    fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    if (href) router.push(href)
    setOpen(false)
  }

  function markAllRead() {
    fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  async function quickPause(e: React.MouseEvent, n: Notif) {
    e.stopPropagation()
    if (!n.meta?.templateId) return
    await fetch(`/api/recurring-invoices/${n.meta.templateId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pause' }),
    })
    setPausedIds(prev => new Set(prev).add(n.id))
    fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    setUnread(prev => Math.max(0, prev - (n.read ? 0 : 1)))
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'var(--bg-3)' : 'none',
          border: 'none',
          color: open ? 'var(--text)' : 'var(--text-3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          padding: 7, borderRadius: 8, position: 'relative',
          transition: 'all 0.12s',
        }}
        className="notif-btn"
      >
        <Bell size={15} strokeWidth={1.8} />
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 14, height: 14, borderRadius: '50%',
            background: '#dc2626', color: '#fff',
            fontSize: 8, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fafbff',
          }}>{unread}</div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.09)',
          borderRadius: 14,
          boxShadow: '0 4px 8px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.12)',
          zIndex: 300, width: 340, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 9px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Notifications</span>
              {unread > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'rgba(220,38,38,0.1)', color: '#c81e1e' }}>{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifs.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>You&apos;re all caught up.</div>
            )}
            {notifs.map(n => {
              const { Icon, color } = TYPE_STYLE[n.type] ?? DEFAULT_STYLE
              const isUnread = !n.read
              const showPause = n.type === 'recurring_invoice_presend' && n.meta?.templateId && !pausedIds.has(n.id)
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 11,
                    padding: '11px 16px',
                    background: isUnread ? 'rgba(0,0,0,0.018)' : 'transparent',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer', position: 'relative',
                    transition: 'background 0.1s',
                  }}
                  className="notif-row"
                  onClick={() => go(n.href, n.id)}
                >
                  {isUnread && (
                    <div style={{ position: 'absolute', left: 5, top: 18, width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    <Icon size={14} style={{ color }} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isUnread ? 600 : 500, color: 'var(--text)', lineHeight: 1.35, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 5 }}>{n.body}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{relativeTime(n.created_at)}</span>
                      {showPause ? (
                        <button
                          onClick={e => quickPause(e, n)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <PauseCircle size={10} /> Pause
                        </button>
                      ) : pausedIds.has(n.id) ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#15803D', fontWeight: 600 }}>
                          <CheckCircle size={10} /> Paused
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => { router.push('/invoicing?tab=recurring'); setOpen(false) }}
              style={{ fontSize: 11.5, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              View recurring invoices →
            </button>
          </div>
        </div>
      )}

      <style>{`
        .notif-btn:hover { background: var(--bg-3) !important; color: var(--text) !important; }
        .notif-row:hover { background: rgba(0,0,0,0.03) !important; }
      `}</style>
    </div>
  )
}
