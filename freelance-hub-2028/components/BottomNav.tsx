'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CheckSquare, Receipt, Users,
  Briefcase, Calculator, TrendingUp, Bot, Globe,
  Calendar, GraduationCap, Plug, Settings, Users2,
} from 'lucide-react'
import { Mic } from 'lucide-react'

const SECTIONS = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks',        icon: CheckSquare,     label: 'Tasks' },
  { href: '/invoicing',    icon: Receipt,         label: 'Invoicing' },
  { href: '/clients',      icon: Users,           label: 'Clients' },
  { href: '/crm',          icon: Users2,          label: 'CRM' },
  { href: '/tax',          icon: Calculator,      label: 'Tax' },
  { href: '/insights',     icon: TrendingUp,      label: 'Insights' },
  { href: '/jobs',         icon: Briefcase,       label: 'Jobs' },
  { href: '/community',    icon: Globe,           label: 'Community' },
  { href: '/calendar',     icon: Calendar,        label: 'Calendar' },
  { href: '/education',    icon: GraduationCap,   label: 'Learn' },
  { href: '/transcriptions', icon: Mic,            label: 'Transcribe' },
  { href: '/integrations', icon: Plug,            label: 'Apps' },
  { href: '/settings',     icon: Settings,        label: 'Settings' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!isMobile) return null

  const navHeight = 64

  return (
    <>
      {/* Centered mic FAB — floats above the nav strip */}
      <Link
        href="/ai-assistant"
        aria-label="AI Voice Assistant"
        style={{
          position: 'fixed',
          bottom: navHeight + 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 110,
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          boxShadow: '0 0 0 5px var(--bg), 0 6px 24px rgba(16,163,74,0.5)',
          flexShrink: 0,
        }}
      >
        <Mic size={26} color="#fff" strokeWidth={2} />
      </Link>

      {/* Scrollable bottom nav strip */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: navHeight,
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch' as any,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          gap: 2,
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {SECTIONS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '6px 10px',
                borderRadius: 10,
                textDecoration: 'none',
                flexShrink: 0,
                minWidth: 56,
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--green-dk)' : 'var(--text-3)',
                background: active ? 'var(--green-light)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
