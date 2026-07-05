'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  BookOpen, BarChart2, Bot, Settings,
  MessageSquare, Receipt, Plug, Briefcase, Zap,
  User, Contact, CalendarDays,
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

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.displayName) setDisplayName(d.displayName)
    }).catch(() => {})
  }, [])

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
          color: active ? '#ffffff' : 'rgba(255,255,255,0.58)',
          background: active ? 'rgba(202,138,4,0.14)' : 'transparent',
          fontWeight: active ? 600 : 400,
          fontSize: 12.5,
          textDecoration: 'none',
          transition: 'background 0.12s, color 0.12s',
          boxShadow: active ? 'inset 3px 0 0 #ca8a04' : 'none',
          letterSpacing: active ? '-0.01em' : '0',
        }}
        className="sidebar-link"
      >
        <Icon size={14} strokeWidth={active ? 2.0 : 1.6} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {shortcut && <span className="nav-shortcut">⌘{shortcut}</span>}
      </Link>
    )
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: '#0a1a0f',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
      flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #0a1a0f, #14532d)',
          border: '1px solid rgba(202,138,4,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(202,138,4,0.1), 0 2px 8px rgba(0,0,0,0.4)', flexShrink: 0,
        }}>
          <span style={{ color: '#ca8a04', fontWeight: 900, fontSize: 11, letterSpacing: '-0.5px' }}>GF</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            <span style={{ color: '#ca8a04' }}>Gild</span><span style={{ color: '#4ade80' }}>Flo</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.30)', fontWeight: 500, letterSpacing: '0.2px', marginTop: 1 }}>Your craft, gilded.</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '10px 10px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)',
              padding: '8px 13px 4px',
            }}>{group.label}</div>
            {group.items.map(({ label, href, icon, key }) => navItem(href, icon, label, key))}
          </div>
        ))}
      </nav>

      {/* Hairline separator */}
      <div style={{ margin: '8px 10px 0', height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* Bottom section */}
      <div style={{ padding: '8px 10px 0', flexShrink: 0 }}>
        {BOTTOM_NAV.map(({ label, href, icon }) => navItem(href, icon, label))}

        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px 12px', marginTop: 4, cursor: 'pointer' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #14532d, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>{displayName.charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>Pro · Active</span>
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div style={{ padding: '4px 13px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <kbd style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 4px', fontFamily: 'inherit' }}>⌘</kbd>
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.20)' }}>1–9 to navigate</span>
        </div>
      </div>

      <style>{`
        .sidebar-link:hover { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.88) !important; }
        .nav-shortcut {
          font-size: 9px; color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 1px 4px; font-family: inherit;
          flex-shrink: 0; opacity: 0; transition: opacity 0.15s;
        }
        .sidebar-link:hover .nav-shortcut { opacity: 1; }
      `}</style>
    </aside>
  )
}
