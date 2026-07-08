'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { href: '/dashboard',    emoji: '🏠', label: 'Home' },
  { href: '/tasks',        emoji: '✅', label: 'Tasks' },
  { href: '/invoicing',    emoji: '🧾', label: 'Invoicing' },
  { href: '/clients',      emoji: '👥', label: 'Clients' },
  { href: '/crm',          emoji: '📇', label: 'CRM' },
  { href: '/tax',          emoji: '📊', label: 'Tax' },
  { href: '/insights',     emoji: '📈', label: 'Insights' },
  { href: '/ai-assistant', emoji: '🤖', label: 'AI Chat' },
  { href: '/jobs',         emoji: '💼', label: 'Jobs' },
  { href: '/community',    emoji: '🌐', label: 'Community' },
  { href: '/calendar',     emoji: '📅', label: 'Calendar' },
  { href: '/education',    emoji: '🎓', label: 'Learn' },
  { href: '/integrations', emoji: '🔌', label: 'Apps' },
  { href: '/settings',     emoji: '⚙️',  label: 'Settings' },
]

export default function MobileNavStrip() {
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
    <div
      style={{
        position: 'sticky',
        top: 52,
        zIndex: 45,
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none' as any,
        display: 'flex',
        padding: '8px 12px',
        gap: 6,
      }}
    >
      {SECTIONS.map(({ href, emoji, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 99,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              border: active
                ? '1.5px solid var(--green-dk)'
                : '1.5px solid var(--border)',
              color: active ? 'var(--green-dk)' : 'var(--text-2)',
              background: active ? 'var(--green-light)' : 'var(--card)',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 13 }}>{emoji}</span>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
