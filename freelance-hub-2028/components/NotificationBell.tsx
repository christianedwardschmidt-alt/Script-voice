'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertCircle, CheckSquare, MessageSquare, TrendingUp } from 'lucide-react'

const NOTIFICATIONS = [
  {
    id: 1, unread: true, Icon: AlertCircle, color: '#dc2626',
    title: 'Invoice overdue · $8,400',
    desc: 'Margono Studio — 22 days past due',
    time: '2d ago', action: 'Send reminder', href: '/invoicing',
  },
  {
    id: 2, unread: true, Icon: CheckSquare, color: '#d97706',
    title: 'Task due today',
    desc: 'Client meeting — Project kickoff',
    time: '4h ago', action: 'View', href: '/tasks',
  },
  {
    id: 3, unread: true, Icon: TrendingUp, color: '#00b857',
    title: 'Revenue milestone',
    desc: 'You hit $17.4k this month — best month ever',
    time: '1d ago', action: 'See insights', href: '/insights',
  },
  {
    id: 4, unread: false, Icon: MessageSquare, color: '#5b5fcf',
    title: 'New reply on your post',
    desc: 'Marcus Williams replied to your pricing thread',
    time: '2d ago', action: 'Read', href: '/community',
  },
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<Set<number>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unread = NOTIFICATIONS.filter(n => n.unread && !read.has(n.id)).length

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function go(href: string) {
    router.push(href)
    setOpen(false)
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
          zIndex: 300, width: 316, overflow: 'hidden',
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
                onClick={() => setRead(new Set(NOTIFICATIONS.map(n => n.id)))}
                style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div>
            {NOTIFICATIONS.map((n, i) => {
              const isUnread = n.unread && !read.has(n.id)
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
                  onClick={() => go(n.href)}
                >
                  {isUnread && (
                    <div style={{ position: 'absolute', left: 5, top: 18, width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${n.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    <n.Icon size={14} style={{ color: n.color }} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isUnread ? 600 : 500, color: 'var(--text)', lineHeight: 1.35, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.desc}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{n.time}</div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 600, flexShrink: 0, marginTop: 2 }}>{n.action} →</span>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => go('/insights')}
              style={{ fontSize: 11.5, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              View all activity →
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
