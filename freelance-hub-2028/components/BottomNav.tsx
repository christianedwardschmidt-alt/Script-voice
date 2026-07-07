'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CheckSquare, Receipt, Users, Menu } from 'lucide-react'

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { href: '/invoicing', icon: Receipt,          label: 'Invoicing' },
  { href: '/clients',   icon: Users,            label: 'Clients' },
]

const itemStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  padding: '7px 4px',
  textDecoration: 'none',
  borderRadius: 10,
  minHeight: 52,
  fontSize: 10,
  fontWeight: 500,
  fontFamily: 'inherit',
  border: 'none',
  cursor: 'pointer',
  color: active ? 'var(--green-dk)' : 'var(--text-3)',
  background: active ? 'var(--green-light)' : 'transparent',
  transition: 'color 0.15s, background 0.15s',
})

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

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
      }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} style={itemStyle(active)}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
            <span>{label}</span>
          </Link>
        )
      })}
      <button
        style={itemStyle(false)}
        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        aria-label="More navigation"
      >
        <Menu size={22} strokeWidth={1.6} />
        <span>More</span>
      </button>
    </nav>
  )
}
