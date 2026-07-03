'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  type: string
  label: string
  sub: string
  href: string
}

const TYPE_ICON: Record<string, string> = {
  Client: '👤', Task: '✓', Invoice: '🧾', CRM: '🤝', Event: '📅', Job: '⚡',
}

const TYPE_COLOR: Record<string, string> = {
  Client: '#16a34a', Task: '#5b5fcf', Invoice: '#f59e0b', CRM: '#ec4899', Event: '#06b6d4', Job: '#00b857',
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
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
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); navigate(results[active].href) }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const showDropdown = open && (results.length > 0 || query.length >= 2)

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', maxWidth: 340 }}>
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search clients, tasks, invoices…"
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
          zIndex: 200, overflow: 'hidden',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '14px 14px', fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : results.map((r, i) => (
            <div
              key={i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={() => navigate(r.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', cursor: 'pointer',
                background: i === active ? 'var(--bg)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{TYPE_ICON[r.type] ?? '•'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[r.type] ?? '#888', background: `${TYPE_COLOR[r.type]}15`, borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                {r.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
