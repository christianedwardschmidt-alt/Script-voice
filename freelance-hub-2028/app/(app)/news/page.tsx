'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Freelancing', 'AI & Tools', 'Business', 'Finance', 'Remote Work', 'Design', 'Tech', 'Consulting']

const CAT_COLORS: Record<string, string> = {
  Freelancing:  'var(--accent-brand)',
  'AI & Tools': '#7C3AED',
  Business:     '#3B82F6',
  Finance:      '#CA8A04',
  'Remote Work':'#14B8A6',
  Design:       '#EC4899',
  Tech:         '#6366F1',
  Consulting:   '#F97316',
}

const CAT_BG: Record<string, string> = {
  Freelancing:  'rgba(var(--accent-brand-rgb),0.08)',
  'AI & Tools': 'rgba(124,58,237,0.08)',
  Business:     'rgba(59,130,246,0.08)',
  Finance:      'rgba(202,138,4,0.08)',
  'Remote Work':'rgba(20,184,166,0.08)',
  Design:       'rgba(236,72,153,0.08)',
  Tech:         'rgba(99,102,241,0.08)',
  Consulting:   'rgba(249,115,22,0.08)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 36e5)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── Bookmark icon ─────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'var(--accent-brand)' : 'none'} stroke={filled ? 'var(--accent-brand)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

// ── Personalization modal ─────────────────────────────────────────────────────

const INDUSTRIES = ['Design', 'Engineering', 'Marketing', 'Writing', 'Consulting', 'Finance', 'Legal', 'Photography', 'Video', 'Other']
const TOPICS = ['AI Tools', 'Freelancing', 'Pricing', 'Client Management', 'Taxes', 'Contracts', 'Remote Work', 'Productivity', 'Marketing', 'Business Growth']

function PersonalizationModal({ onClose }: { onClose: () => void }) {
  const [industries, setIndustries] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/news/preferences').then(r => r.json()).then(d => {
      try { setIndustries(JSON.parse(d.industries ?? '[]')) } catch { /* empty */ }
      try { setTopics(JSON.parse(d.topics ?? '[]')) } catch { /* empty */ }
    })
  }, [])

  function toggle(arr: string[], val: string, set: (a: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function save() {
    setSaving(true)
    await fetch('/api/news/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industries, topics }),
    })
    setSaving(false)
    onClose()
  }

  const chipStyle = (active: boolean) => ({
    padding: '7px 14px', border: `1.5px solid ${active ? 'var(--accent-brand)' : '#E5E7EB'}`,
    borderRadius: 20, fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: 'pointer', background: active ? 'rgba(var(--accent-brand-rgb),0.08)' : 'white',
    color: active ? 'var(--accent-brand)' : '#374151', transition: 'all 0.1s',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, padding: 36, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Customize Your Feed</h3>
        <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: 14 }}>Tell us about your work so we can surface the most relevant stories.</p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>What industries do you work in?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INDUSTRIES.map(i => (
              <button key={i} style={chipStyle(industries.includes(i))} onClick={() => toggle(industries, i, setIndustries)}>{i}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Topics you care about</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map(t => (
              <button key={t} style={chipStyle(topics.includes(t))} onClick={() => toggle(topics, t, setTopics)}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '11px 0', border: 'none', borderRadius: 10, background: 'var(--accent-brand)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Article card ──────────────────────────────────────────────────────────────

function ArticleCard({ article, onBookmark }: { article: Article; onBookmark: (id: number, bookmarked: boolean) => void }) {
  const color = CAT_COLORS[article.category] ?? '#6B7280'
  const bg = CAT_BG[article.category] ?? 'rgba(107,114,128,0.08)'

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: bg, color, letterSpacing: '0.03em' }}>
          {article.category}
        </span>
        <span style={{ fontSize: 11, background: 'rgba(107,114,128,0.08)', color: '#9CA3AF', padding: '3px 8px', borderRadius: 20 }}>AI Summary</span>
      </div>

      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.35, letterSpacing: '-0.01em',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.title}
      </h3>

      <p style={{ margin: 0, fontSize: 14, color: '#6B7280', lineHeight: 1.65,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {article.summary}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{article.source}</span>
          <span style={{ fontSize: 12, color: '#D1D5DB' }}>·</span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{relativeTime(article.published_at)}</span>
          <span style={{ fontSize: 12, color: '#D1D5DB' }}>·</span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{article.read_time} min read</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600, textDecoration: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            Read →
          </a>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(article.id, !!article.bookmarked) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            <BookmarkIcon filled={!!article.bookmarked} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [briefing, setBriefing] = useState('')
  const [briefingDate, setBriefingDate] = useState('')
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [regenBriefing, setRegenBriefing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showPersonalize, setShowPersonalize] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchArticles = useCallback(async (cat: string) => {
    setLoadingArticles(true)
    const url = cat === 'All' ? '/api/news' : `/api/news?category=${encodeURIComponent(cat)}`
    const res = await fetch(url)
    const data = await res.json()
    setArticles(data)
    setLoadingArticles(false)
  }, [])

  useEffect(() => { fetchArticles('All') }, [fetchArticles])

  useEffect(() => {
    fetch(`/api/news/briefing/${today}`)
      .then(r => r.json())
      .then(d => { setBriefing(d.content ?? ''); setBriefingDate(d.date ?? today) })
      .catch(() => {})
      .finally(() => setLoadingBriefing(false))
  }, [today])

  async function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    await fetchArticles(cat)
  }

  async function handleBookmark(id: number, wasBookmarked: boolean) {
    if (wasBookmarked) {
      await fetch(`/api/news/bookmarks/${id}`, { method: 'DELETE' })
    } else {
      await fetch('/api/news/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: id }),
      })
    }
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: wasBookmarked ? 0 : 1 } : a))
  }

  async function regenerateBriefing() {
    setRegenBriefing(true)
    const res = await fetch(`/api/news/briefing/${today}`, { method: 'POST' })
    const data = await res.json()
    setBriefing(data.content ?? '')
    setRegenBriefing(false)
  }

  const todayFmt = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 52px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Industry News
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: '#6B7280', lineHeight: 1.5 }}>
            AI-curated daily briefing for independent professionals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/news/bookmarks')}
            style={{ padding: '9px 18px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <BookmarkIcon filled={false} />
            Bookmarks
          </button>
          <button
            onClick={() => setShowPersonalize(true)}
            style={{ padding: '9px 18px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Customize Feed
          </button>
        </div>
      </div>

      {/* Daily briefing hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1A0F 0%, var(--accent-brand-dark) 100%)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 32,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(var(--accent-brand-rgb),0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Today's Briefing</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'white', fontFamily: 'var(--font-syne)' }}>{todayFmt}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={regenerateBriefing}
                disabled={regenBriefing}
                style={{ padding: '8px 16px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, cursor: regenBriefing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {regenBriefing ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Regenerate
                  </>
                )}
              </button>
              <button
                onClick={() => router.push(`/news/briefing/${today}`)}
                style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: 'var(--accent-brand)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Read Full Briefing →
              </button>
            </div>
          </div>

          {loadingBriefing ? (
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              {[100, 90, 95].map((w, i) => (
                <div key={i} style={{ height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 7, width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {briefing}
            </p>
          )}

          {!loadingBriefing && (
            <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              Generated at 7:00 AM · Powered by Claude AI
            </div>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const active = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '7px 16px', border: `1.5px solid ${active ? (CAT_COLORS[cat] ?? 'var(--accent-brand)') : '#E5E7EB'}`,
                borderRadius: 20, fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                background: active ? (CAT_BG[cat] ?? 'rgba(var(--accent-brand-rgb),0.08)') : 'white',
                color: active ? (CAT_COLORS[cat] ?? 'var(--accent-brand)') : '#6B7280',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Articles grid */}
      {loadingArticles ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', padding: '22px 24px', height: 200, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📰</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No articles in this category yet</div>
          <div style={{ fontSize: 14 }}>Try a different category or check back tomorrow.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {articles.map(a => (
            <ArticleCard key={a.id} article={a} onBookmark={handleBookmark} />
          ))}
        </div>
      )}

      {showPersonalize && <PersonalizationModal onClose={() => setShowPersonalize(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
