'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  BookOpen, BarChart2, Bot, Settings,
  MessageSquare, Receipt, Plug, Briefcase, Zap,
  User, Contact, CalendarDays, ChevronRight,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'WORK',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Calendar',  href: '/calendar',  icon: CalendarDays },
      { label: 'Tasks',     href: '/tasks',      icon: CheckSquare },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { label: 'Clients',   href: '/clients',   icon: Users },
      { label: 'CRM',       href: '/crm',       icon: Briefcase },
      { label: 'Invoicing', href: '/invoicing', icon: Receipt },
      { label: 'Tax',       href: '/tax',       icon: FileText },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { label: 'Jobs',      href: '/jobs',      icon: Zap },
      { label: 'Education', href: '/education', icon: BookOpen },
      { label: 'Community', href: '/community', icon: MessageSquare },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'AI Assistant',  href: '/ai-assistant',  icon: Bot },
      { label: 'Insights',      href: '/insights',      icon: BarChart2 },
      { label: 'Integrations',  href: '/integrations',  icon: Plug },
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

  function navItem(href: string, icon: React.ElementType, label: string) {
    const Icon = icon
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 10px', borderRadius: 8, marginBottom: 1,
          color: active ? 'var(--green)' : 'rgba(15,17,23,0.55)',
          background: active ? 'rgba(0,184,87,0.08)' : 'transparent',
          fontWeight: active ? 600 : 450,
          fontSize: 12.5,
          textDecoration: 'none',
          transition: 'all 0.12s',
          border: active ? '1px solid rgba(0,184,87,0.15)' : '1px solid transparent',
        }}
        className="sidebar-link"
      >
        <Icon size={15} strokeWidth={active ? 2.2 : 1.7} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {active && <ChevronRight size={11} style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }} />}
      </Link>
    )
  }

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #007a3a, #00b857)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,184,87,0.3)',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '-0.5px' }}>LF</span>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.4px', color: '#0f1117', lineHeight: 1.1 }}>LanceFlo</div>
          <div style={{ fontSize: 10, color: 'rgba(15,17,23,0.35)', fontWeight: 500 }}>Freelancer Suite · 2028</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 10px 0', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'rgba(15,17,23,0.28)',
              padding: '8px 10px 4px',
            }}>{group.label}</div>
            {group.items.map(({ label, href, icon }) => navItem(href, icon, label))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '8px 10px 0', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        {BOTTOM_NAV.map(({ label, href, icon }) => navItem(href, icon, label))}

        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '10px 10px 12px', marginTop: 4,
          cursor: 'pointer',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #007a3a, #00b857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>C</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chris Schmidt</div>
            <div style={{ fontSize: 10, color: 'rgba(15,17,23,0.35)' }}>Pro Plan</div>
          </div>
        </div>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(0,0,0,0.04) !important;
          color: rgba(15,17,23,0.8) !important;
          border-color: transparent !important;
        }
        .sidebar-link.active:hover {
          background: rgba(0,184,87,0.1) !important;
          color: var(--green) !important;
          border-color: rgba(0,184,87,0.2) !important;
        }
      `}</style>
    </aside>
  )
}
