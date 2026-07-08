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

type AIState = 'idle' | 'loading' | 'done' | 'error'

export default function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [aiState, setAiState] = useState<AIState>('idle')
  const [aiText, setAiText] = useState('')

  const trimmed = query.trim()
  const pageResults = trimmed
    ? ROUTES.filter(r => r.label.toLowerCase().includes(trimmed.toLowerCase()))
    : []

  // Total items for keyboard nav: page results + 1 AI row
  const totalItems = trimmed ? pageResults.length + 1 : 0
  const aiIdx = pageResults.length // AI row is always last

  async function askAI() {
    if (!trimmed) return
    setAiState('loading')
    setAiText('')
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }] }),
      })
      const data = await res.json()
      setAiText(data.text || 'No response.')
      setAiState('done')
    } catch {
      setAiText('Something went wrong. Check your API key.')
      setAiState('error')
    }
  }

  function navigate(href: string) {
    setQuery(''); setFocused(false); setAiState('idle'); setAiText('')
    inputRef.current?.blur()
    router.push(href)
  }

  function dismiss() {
    setQuery(''); setFocused(false); setAiState('idle'); setAiText('')
    inputRef.current?.blur()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { dismiss(); return }
    if (!totalItems) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, totalItems - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx === aiIdx) { askAI() }
      else { const r = pageResults[activeIdx]; if (r) navigate(r.href) }
    }
  }

  const showDropdown = focused && !!trimmed

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 440, margin: '0 24px' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: focused ? '#fff' : '#F8FAFC',
        border: `1px solid ${focused ? '#16A34A' : '#E5E7EB'}`,
        borderRadius: 10, padding: '0 12px', height: 38,
        boxShadow: focused ? '0 0 0 3px rgba(22,163,74,0.08)' : 'none',
        transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
      }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={focused ? '#16A34A' : '#9CA3AF'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.15s' }}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); setAiState('idle'); setAiText('') }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKey}
          placeholder="Search or ask AI anything…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13.5, color: '#111827', fontFamily: 'var(--font-body)',
          }}
        />

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
          {/* Page results */}
          {pageResults.map((r, i) => (
            <button
              key={r.href}
              onMouseDown={() => navigate(r.href)}
              onMouseEnter={() => setActiveIdx(i)}
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
              {/* Page icon */}
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45, flexShrink: 0 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              {r.label}
            </button>
          ))}

          {/* Divider if there are page results */}
          {pageResults.length > 0 && (
            <div style={{ height: 1, background: '#F3F4F6', margin: '2px 0' }} />
          )}

          {/* AI row */}
          {aiState === 'idle' || aiState === 'error' ? (
            <button
              onMouseDown={askAI}
              onMouseEnter={() => setActiveIdx(aiIdx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: activeIdx === aiIdx ? 'rgba(22,163,74,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13.5,
                color: '#16A34A', textAlign: 'left',
              }}
            >
              {/* Spark / AI icon */}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>Ask AI: <span style={{ fontWeight: 600 }}>&ldquo;{trimmed}&rdquo;</span></span>
            </button>
          ) : aiState === 'loading' ? (
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280', fontSize: 13 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span style={{ color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Thinking…</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : (
            /* AI response */
            <div style={{ padding: '12px 14px', borderTop: '1px solid #F0FDF4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16A34A', fontFamily: 'var(--font-body)' }}>AI Answer</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'var(--font-body)', margin: 0 }}>{aiText}</p>
              <button
                onMouseDown={dismiss}
                style={{
                  marginTop: 10, fontSize: 11.5, color: '#9CA3AF', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
