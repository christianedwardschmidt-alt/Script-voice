'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, CheckSquare, Users, Clock, X } from 'lucide-react'

const ACTIONS = [
  { label: 'New Invoice',  icon: FileText,    href: '/invoicing',  shortcut: 'I', color: '#d97706' },
  { label: 'Add Task',     icon: CheckSquare, href: '/tasks',      shortcut: 'T', color: '#16a34a' },
  { label: 'Add Client',   icon: Users,       href: '/clients',    shortcut: 'C', color: '#16a34a' },
  { label: 'Log Time',     icon: Clock,       href: '/calendar',   shortcut: 'L', color: '#0ea5e9' },
]

export default function QuickActions() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 9,
          background: open
            ? 'linear-gradient(135deg, #15803d, #16a34a)'
            : 'linear-gradient(135deg, #15803d, #16a34a)',
          color: '#fff', fontSize: 12, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 14px rgba(22,163,74,0.28)',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {open ? <X size={13} /> : <Plus size={13} />}
        Quick Add
        <kbd style={{
          background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 4, padding: '0px 4px', fontSize: 9.5, fontFamily: 'inherit',
          marginLeft: 2,
        }}>⌘/</kbd>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          padding: 8, zIndex: 300, minWidth: 200,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(15,17,23,0.3)', padding: '4px 8px 8px' }}>Quick Add</div>
          {ACTIONS.map(({ label, icon: Icon, href, shortcut, color }) => (
            <button
              key={label}
              onMouseDown={() => go(href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 10px', borderRadius: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(15,17,23,0.75)', fontSize: 12.5, fontWeight: 500,
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.1s',
              }}
              className="quick-action-btn"
            >
              <span style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: `${color}12`, border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} style={{ color }} strokeWidth={2} />
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              <kbd style={{
                background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 4, padding: '1px 5px', fontSize: 9.5, color: 'rgba(15,17,23,0.35)',
                fontFamily: 'inherit',
              }}>{shortcut}</kbd>
            </button>
          ))}
          <style>{`
            .quick-action-btn:hover { background: rgba(0,0,0,0.04) !important; color: #0f1117 !important; }
          `}</style>
        </div>
      )}
    </div>
  )
}
