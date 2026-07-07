'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  BookOpen, BarChart2, Bot, Settings,
  MessageSquare, Receipt, Plug, Briefcase, Zap,
  User, Contact, CalendarDays, LogOut, ChevronUp,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'WORK',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, key: '1' },
      { label: 'Calendar',  href: '/calendar',  icon: CalendarDays,    key: '2' },
      { label: 'Tasks',     href: '/tasks',      icon: CheckSquare,     key: '3' },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { label: 'Clients',   href: '/clients',   icon: Users,    key: '4' },
      { label: 'CRM',       href: '/crm',       icon: Briefcase, key: '5' },
      { label: 'Invoicing', href: '/invoicing', icon: Receipt,  key: '6' },
      { label: 'Tax',       href: '/tax',       icon: FileText, key: '7' },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { label: 'Jobs',      href: '/jobs',      icon: Zap,           key: '8' },
      { label: 'Education', href: '/education', icon: BookOpen,      key: '9' },
      { label: 'Community', href: '/community', icon: MessageSquare, key: '0' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'AI Assistant', href: '/ai-assistant', icon: Bot,      key: undefined },
      { label: 'Insights',     href: '/insights',     icon: BarChart2, key: undefined },
      { label: 'Integrations', href: '/integrations', icon: Plug,     key: undefined },
    ],
  },
]

const BOTTOM_NAV = [
  { label: 'Profile',  href: '/profile',  icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Contact',  href: '/contact',  icon: Contact },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('Chris Schmidt')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.displayName) setDisplayName(d.displayName)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUserMenu])

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  useEffect(() => {
    const allItems = NAV_GROUPS.flatMap(g => g.items)
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.key.match(/^[0-9]$/)) return
      const item = allItems.find(i => i.key === e.key)
      if (item) { e.preventDefault(); router.push(item.href) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  function navItem(href: string, icon: React.ElementType, label: string, shortcut?: string) {
    const Icon = icon
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        title={shortcut ? `${label} (⌘${shortcut})` : label}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 10px 7px 13px', borderRadius: 8, marginBottom: 1,
          color: active ? 'var(--green-dk)' : 'var(--text-2)',
          background: active ? 'var(--green-light)' : 'transparent',
          fontWeight: active ? 600 : 450,
          fontSize: 12.5,
          textDecoration: 'none',
          transition: 'background 0.12s, color 0.12s, box-shadow 0.12s',
          boxShadow: active ? 'inset 3px 0 0 #00b857' : 'none',
        }}
        className="sidebar-link"
      >
        <Icon size={15} strokeWidth={active ? 2.2 : 1.7} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {shortcut && <span className="nav-shortcut">⌘{shortcut}</span>}
      </Link>
    )
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
      flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #007a3a, #00b857)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,184,87,0.3)', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '-0.5px' }}>GW</span>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
            <span style={{ color: '#0A1A0F' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>Work free. Stay connected.</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 10px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: 'var(--text-3)',
              padding: '8px 13px 4px',
            }}>{group.label}</div>
            {group.items.map(({ label, href, icon, key }) => navItem(href, icon, label, key))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '8px 10px 0', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {BOTTOM_NAV.map(({ label, href, icon }) => navItem(href, icon, label))}

        {/* User card */}
        <div ref={userMenuRef} style={{ position: 'relative', marginTop: 4 }}>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 100,
            }}>
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', fontSize: 12.5, color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}
                className="user-menu-item"
              >
                <User size={13} /> View Profile
              </Link>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button
                onClick={signOut}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 13px', fontSize: 12.5, color: '#dc2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                className="user-menu-item"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
            className="user-card-btn"
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #007a3a, #00b857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}>{displayName.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00b857' }} />
                <span style={{ fontSize: 10, color: 'var(--text-2)' }}>Pro Plan · Active</span>
              </div>
            </div>
            <ChevronUp size={13} style={{ color: 'var(--text-3)', flexShrink: 0, transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <div style={{ padding: '6px 13px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <kbd style={{ fontSize: 8.5, color: 'var(--text-3)', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 4px', fontFamily: 'inherit' }}>⌘</kbd>
          <span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>1–9 to navigate</span>
        </div>
      </div>

      <style>{`
        .sidebar-link:hover { background: var(--bg-3) !important; color: var(--text) !important; }
        .nav-shortcut {
          font-size: 9px; color: var(--text-3);
          background: var(--bg-3); border: 1px solid var(--border);
          border-radius: 4px; padding: 1px 4px; font-family: inherit;
          flex-shrink: 0; opacity: 0; transition: opacity 0.15s;
        }
        .sidebar-link:hover .nav-shortcut { opacity: 1; }
        .user-menu-item:hover { background: var(--bg-3) !important; }
        .user-card-btn:hover { background: var(--bg-3) !important; border-radius: 8px; }
      `}</style>
    </aside>
  )
}
