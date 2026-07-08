'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CheckSquare, Receipt, Users, Menu, Mic } from 'lucide-react'

const LEFT_TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
]
const RIGHT_TABS = [
  { href: '/invoicing', icon: Receipt, label: 'Invoices' },
  { href: '/clients',   icon: Users,   label: 'Clients' },
]

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 3,
  padding: '6px 4px 8px',
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--green-dk)' : 'var(--text-3)',
  background: 'transparent',
  transition: 'color 0.15s',
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
        alignItems: 'flex-end',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
        minHeight: 60,
      }}
    >
      {/* Left tabs */}
      {LEFT_TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} style={tabStyle(active)}>
            <Icon size={21} strokeWidth={active ? 2.2 : 1.6} />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Center mic FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 8, position: 'relative' }}>
        <Link
          href="/ai-assistant"
          aria-label="AI Voice Assistant"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(16,163,74,0.45), 0 0 0 4px var(--card)',
            marginBottom: 4,
            flexShrink: 0,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
        >
          <Mic size={24} color="#fff" strokeWidth={2} />
        </Link>
      </div>

      {/* Right tabs */}
      {RIGHT_TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} style={tabStyle(active)}>
            <Icon size={21} strokeWidth={active ? 2.2 : 1.6} />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* More */}
      <button
        style={tabStyle(false)}
        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        aria-label="More navigation"
      >
        <Menu size={21} strokeWidth={1.6} />
        <span>More</span>
      </button>
    </nav>
  )
}
