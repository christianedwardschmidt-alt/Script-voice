'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  type: string
  label: string
  sub: string
  href: string
}

const NAV_PAGES = [
  { label: 'Dashboard',    href: '/dashboard',    icon: '📊', keywords: ['dashboard', 'home', 'overview'] },
  { label: 'Calendar',     href: '/calendar',     icon: '📅', keywords: ['calendar', 'schedule', 'events'] },
  { label: 'Tasks',        href: '/tasks',        icon: '✓',  keywords: ['tasks', 'todo', 'to-do'] },
  { label: 'Clients',      href: '/clients',      icon: '👤', keywords: ['clients', 'client'] },
  { label: 'CRM',          href: '/crm',          icon: '🤝', keywords: ['crm', 'leads', 'pipeline'] },
  { label: 'Invoicing',    href: '/invoicing',    icon: '🧾', keywords: ['invoice', 'invoicing', 'billing'] },
  { label: 'Community',    href: '/community',    icon: '💬', keywords: ['community', 'posts', 'social'] },
  { label: 'Jobs',         href: '/jobs',         icon: '⚡', keywords: ['jobs', 'job', 'gigs'] },
  { label: 'Education',    href: '/education',    icon: '📚', keywords: ['education', 'courses', 'learn'] },
  { label: 'Integrations', href: '/integrations', icon: '🔌', keywords: ['integrations', 'connect', 'apps'] },
  { label: 'Tax',          href: '/tax',          icon: '💰', keywords: ['tax', 'taxes', 'deductions'] },
  { label: 'Insights',     href: '/insights',     icon: '📈', keywords: ['insights', 'analytics', 'stats'] },
  { label: 'AI Assistant', href: '/ai-assistant', icon: '✨', keywords: ['ai', 'assistant', 'chat'] },
  { label: 'Profile',      href: '/profile',      icon: '👤', keywords: ['profile', 'me', 'account'] },
  { label: 'Settings',     href: '/settings',     icon: '⚙️', keywords: ['settings', 'preferences'] },
]

const TYPE_ICON: Record<string, string> = {
  Client: '👤', Task: '✓', Invoice: '🧾', CRM: '🤝', Event: '📅', Job: '⚡',
}
const TYPE_COLOR: Record<string, string> = {
  Client: '#4347a8', Task: '#5b5fcf', Invoice: '#f59e0b', CRM: '#ec4899', Event: '#06b6d4', Job: '#5b5fcf',
}

function formatAnswer(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**'))
      return <div key={i} style={{ fontWeight: 700, color: 'var(--text)', marginTop: i > 0 ? 6 : 0, marginBottom: 2, fontSize: 12 }}>{line.replace(/\*\*/g, '')}</div>
    if (line.startsWith('• '))
      return <div key={i} style={{ paddingLeft: 12, color: 'var(--text-2)', fontSize: 12, marginBottom: 1, position: 'relative' }}><span style={{ position: 'absolute', left: 2, color: '#5b5fcf' }}>•</span>{line.slice(2)}</div>
    if (line === '') return <div key={i} style={{ height: 4 }} />
    return <div key={i} style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>{line}</div>
  })
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [navMatches, setNavMatches] = useState<typeof NAV_PAGES>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    setAiAnswer(null)
    if (q.length < 2) { setResults([]); setNavMatches([]); return }
    // Nav matches
    const lower = q.toLowerCase()
    const nav = NAV_PAGES.filter(p => p.keywords.some(k => k.includes(lower)) || p.label.toLowerCase().includes(lower))
    setNavMatches(nav.slice(0, 3))
    // Data search
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setActive(0)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 180)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
    setResults([])
    setNavMatches([])
    setAiAnswer(null)
  }

  async function askAI() {
    setAiLoading(true)
    setAiAnswer(null)
    const res = await fetch(`/api/ai-quick?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setAiAnswer(data.answer)
    setAiLoading(false)
  }

  const allItems = [...navMatches.map(n => ({ ...n, itemType: 'nav' })), ...results.map(r => ({ ...r, itemType: 'data' }))]
  const totalItems = allItems.length + (query.length >= 2 ? 1 : 0) // +1 for AI row

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, totalItems - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (active < allItems.length) {
        const item = allItems[active]
        navigate(item.href)
      } else {
        askAI()
      }
    }
    if (e.key === 'Escape') { setOpen(false); setAiAnswer(null); inputRef.current?.blur() }
  }

  const showDropdown = open && query.length >= 2

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', maxWidth: 380 }}>
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setAiAnswer(null) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search or ask AI anything…"
        className="search-input"
        autoComplete="off"
      />
      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
        <kbd style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'inherit' }}>⌘</kbd>
        <kbd style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'inherit' }}>K</kbd>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 200, overflow: 'hidden', maxWidth: 480,
        }}>

          {/* Nav shortcuts */}
          {navMatches.length > 0 && (
            <>
              <div style={{ padding: '7px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Navigate</div>
              {navMatches.map((p, i) => (
                <div key={p.href} onMouseEnter={() => setActive(i)} onMouseDown={() => navigate(p.href)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: active === i ? 'var(--bg)' : 'transparent' }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{p.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Go to {p.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>↵</span>
                </div>
              ))}
            </>
          )}

          {/* Data results */}
          {results.length > 0 && (
            <>
              <div style={{ padding: '7px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderTop: navMatches.length > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>Results</div>
              {results.map((r, i) => {
                const idx = navMatches.length + i
                return (
                  <div key={i} onMouseEnter={() => setActive(idx)} onMouseDown={() => navigate(r.href)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: active === idx ? 'var(--bg)' : 'transparent' }}>
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{TYPE_ICON[r.type] ?? '•'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[r.type] ?? '#888', background: `${TYPE_COLOR[r.type]}15`, borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>{r.type}</span>
                  </div>
                )
              })}
            </>
          )}

          {/* AI row */}
          <div style={{ borderTop: (navMatches.length > 0 || results.length > 0) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            {/* Ask AI trigger — only shown when no answer yet */}
            {!aiAnswer && (
              <div
                onMouseEnter={() => setActive(allItems.length)}
                onMouseDown={askAI}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                  background: active === allItems.length ? 'rgba(91,95,207,0.06)' : 'rgba(91,95,207,0.02)',
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>✨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                    {aiLoading ? 'AI is thinking…' : `Ask AI: "${query}"`}
                  </div>
                  {!aiLoading && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Get an instant answer</div>}
                </div>
                {!aiLoading && <span style={{ fontSize: 10, fontWeight: 700, color: '#5b5fcf', background: 'rgba(91,95,207,0.12)', borderRadius: 4, padding: '1px 6px' }}>AI</span>}
                {aiLoading && <div style={{ display: 'flex', gap: 3 }}>{[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#5b5fcf', opacity: 0.7 }} />)}</div>}
              </div>
            )}

            {/* Inline AI answer — separate from the clickable row */}
            {aiAnswer && (
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>✨</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5b5fcf' }}>AI Answer</span>
                  </div>
                  <button
                    onMouseDown={e => { e.stopPropagation(); setAiAnswer(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', lineHeight: 1, padding: '0 2px' }}
                  >×</button>
                </div>
                <div style={{ marginBottom: 10 }}>{formatAnswer(aiAnswer)}</div>
                <button
                  onMouseDown={e => { e.stopPropagation(); navigate(`/ai-assistant?q=${encodeURIComponent(query)}`) }}
                  style={{ fontSize: 11, color: '#5b5fcf', background: 'rgba(91,95,207,0.08)', border: '1px solid rgba(91,95,207,0.2)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  Continue in AI Assistant →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
