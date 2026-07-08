'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const ROUTES = [
  { label: 'Dashboard',    href: '/dashboard' },
  { label: 'Tasks',        href: '/tasks' },
  { label: 'Calendar',     href: '/calendar' },
  { label: 'Clients',      href: '/clients' },
  { label: 'CRM',          href: '/crm' },
  { label: 'Invoicing',    href: '/invoicing' },
  { label: 'Tax',          href: '/tax' },
  { label: 'Jobs',         href: '/jobs' },
  { label: 'Education',    href: '/education' },
  { label: 'Community',    href: '/community' },
  { label: 'AI Assistant', href: '/ai-assistant' },
  { label: 'Insights',     href: '/insights' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Profile',      href: '/profile' },
  { label: 'Settings',     href: '/settings' },
  { label: 'Contact',      href: '/contact' },
]

export default function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const results = query.trim()
    ? ROUTES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()))
    : []

  function navigate(href: string) {
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
    router.push(href)
  }

  function onKey(e: React.KeyboardEvent) {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); navigate(results[activeIdx]?.href ?? results[0].href) }
    if (e.key === 'Escape')    { setQuery(''); setFocused(false); inputRef.current?.blur() }
  }

  const showDropdown = focused && results.length > 0

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 440, margin: '0 24px' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: focused ? '#fff' : '#F8FAFC',
        border: `1px solid ${focused ? '#16A34A' : '#E5E7EB'}`,
        borderRadius: 10,
        padding: '0 12px',
        height: 38,
        boxShadow: focused ? '0 0 0 3px rgba(22,163,74,0.08)' : 'none',
        transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
      }}>
        {/* Search icon */}
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={focused ? '#16A34A' : '#9CA3AF'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.15s' }}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKey}
          placeholder="Search pages, clients, invoices…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13.5, color: '#111827', fontFamily: 'var(--font-body)',
          }}
        />

        {/* ⌘K hint */}
        {!focused && (
          <kbd style={{
            fontSize: 10.5, color: '#9CA3AF', background: '#F3F4F6',
            border: '1px solid #E5E7EB', borderRadius: 5,
            padding: '1px 5px', fontFamily: 'inherit', flexShrink: 0,
          }}>⌘K</kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          overflow: 'hidden', zIndex: 100,
        }}>
          {results.map((r, i) => (
            <button
              key={r.href}
              onMouseDown={() => navigate(r.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px',
                background: i === activeIdx ? '#F0FDF4' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13.5,
                color: i === activeIdx ? '#16A34A' : '#374151',
                textAlign: 'left',
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
