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
  const [isDemo, setIsDemo] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function toggle() { setIsMobileOpen(v => !v) }
    window.addEventListener('toggle-sidebar', toggle)
    return () => window.removeEventListener('toggle-sidebar', toggle)
  }, [])

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.displayName) setDisplayName(d.displayName)
    }).catch(() => {})
    setIsDemo(document.cookie.includes('gw_demo=1'))
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
          padding: '9px 12px 9px 14px', borderRadius: 8, marginBottom: 2,
          color: active ? '#16A34A' : 'rgba(255,255,255,0.58)',
          background: active ? 'rgba(22,163,74,0.1)' : 'transparent',
          fontWeight: active ? 600 : 400,
          fontSize: 13.5,
          textDecoration: 'none',
          transition: 'background 0.12s, color 0.12s',
          borderLeft: active ? '3px solid #16A34A' : '3px solid transparent',
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
    <>
    <div
      className={`sidebar-backdrop${isMobileOpen ? ' sidebar-open' : ''}`}
      onClick={() => setIsMobileOpen(false)}
    />
    <aside
      className={`sidebar-aside${isMobileOpen ? ' sidebar-open' : ''}`}
      style={{
        width: 224, minHeight: '100vh',
        background: '#0A1A0F',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
        flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
      }}>

      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1, fontFamily: 'var(--font-syne), Syne, sans-serif' }}>
            <span style={{ color: '#ffffff' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginTop: 3, letterSpacing: '0.02em' }}>Work free. Stay connected.</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '10px 10px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
              padding: '8px 14px 4px',
            }}>{group.label}</div>
            {group.items.map(({ label, href, icon, key }) => navItem(href, icon, label, key))}
          </div>
        ))}
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div style={{ margin: '0 10px 8px', padding: '10px 12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818CF8', marginBottom: 4 }}>Demo mode</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: 8 }}>You're browsing read-only sample data.</div>
          <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '6px 10px', background: '#6366F1', color: '#fff', borderRadius: 7, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
            Create free account
          </Link>
        </div>
      )}

      {/* Bottom section */}
      <div style={{ padding: '8px 10px 0', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {BOTTOM_NAV.map(({ label, href, icon }) => navItem(href, icon, label))}

        {/* User card */}
        <div ref={userMenuRef} style={{ position: 'relative', marginTop: 4 }}>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
              background: '#132A1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden', zIndex: 100,
            }}>
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, textDecoration: 'none' }}
                className="user-menu-item"
              >
                <User size={13} /> View Profile
              </Link>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <button
                onClick={signOut}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: '#F87171', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                className="user-menu-item"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
          <button
            onClick={() => setShowUserMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
            className="user-card-btn"
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #14532D, #16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{displayName.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Pro Plan · Active</span>
              </div>
            </div>
            <ChevronUp size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <div style={{ padding: '4px 14px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <kbd style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>⌘</kbd>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>1–9 to navigate</span>
        </div>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .sidebar-link.active:hover {
          background: rgba(22,163,74,0.14) !important;
          color: #16A34A !important;
        }
        .nav-shortcut {
          font-size: 9px; color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 1px 4px; font-family: inherit;
          flex-shrink: 0; opacity: 0; transition: opacity 0.15s;
        }
        .sidebar-link:hover .nav-shortcut { opacity: 1; }
        .user-menu-item:hover { background: rgba(255,255,255,0.06) !important; }
        .user-card-btn:hover { background: rgba(255,255,255,0.05) !important; border-radius: 8px; }
      `}</style>
    </aside>
    </>
  )
}
