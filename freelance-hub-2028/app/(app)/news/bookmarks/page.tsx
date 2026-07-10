'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Article {
  id: number
  title: string
  summary: string
  source: string
  source_url: string
  category: string
  published_at: string
  read_time: number
  bookmarked: number
}

const CAT_COLORS: Record<string, string> = {
  Freelancing:  '#16A34A',
  'AI & Tools': '#7C3AED',
  Business:     '#3B82F6',
  Finance:      '#CA8A04',
  'Remote Work':'#14B8A6',
  Design:       '#EC4899',
  Tech:         '#6366F1',
  Consulting:   '#F97316',
}

const CAT_BG: Record<string, string> = {
  Freelancing:  'rgba(22,163,74,0.08)',
  'AI & Tools': 'rgba(124,58,237,0.08)',
  Business:     'rgba(59,130,246,0.08)',
  Finance:      'rgba(202,138,4,0.08)',
  'Remote Work':'rgba(20,184,166,0.08)',
  Design:       'rgba(236,72,153,0.08)',
  Tech:         'rgba(99,102,241,0.08)',
  Consulting:   'rgba(249,115,22,0.08)',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 36e5)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function BookmarksPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news/bookmarks')
      .then(r => r.json())
      .then(data => { setArticles(data); setLoading(false) })
  }, [])

  async function removeBookmark(id: number) {
    await fetch(`/api/news/bookmarks/${id}`, { method: 'DELETE' })
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="page-pad" style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 52px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => router.push('/news')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14, fontWeight: 600, padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to News
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Bookmarks
          </h1>
        </div>
        {articles.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm('Clear all bookmarks?')) return
              await Promise.all(articles.map(a => fetch(`/api/news/bookmarks/${a.id}`, { method: 'DELETE' })))
              setArticles([])
            }}
            style={{ padding: '8px 16px', border: '1.5px solid #FEE2E2', borderRadius: 8, background: 'white', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 120, background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No bookmarks yet</div>
          <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 20 }}>Save articles from the news feed to read them later.</div>
          <button
            onClick={() => router.push('/news')}
            style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: '#16A34A', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Browse News
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles.map(a => {
            const color = CAT_COLORS[a.category] ?? '#6B7280'
            const bg = CAT_BG[a.category] ?? 'rgba(107,114,128,0.08)'
            return (
              <div key={a.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', padding: '20px 22px', display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color }}>
                      {a.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{relativeTime(a.published_at)}</span>
                    <span style={{ fontSize: 12, color: '#D1D5DB' }}>·</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{a.read_time} min read</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                    {a.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.summary}
                  </p>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{a.source}</span>
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
                      Read full article →
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => removeBookmark(a.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0, color: '#9CA3AF', alignSelf: 'flex-start' }}
                  title="Remove bookmark"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
