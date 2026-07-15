'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Briefing {
  date: string
  content: string
  generated_at: string
}

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

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 36e5)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function BriefingPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params)
  const router = useRouter()
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/news/briefing/${date}`).then(r => r.json()),
      fetch('/api/news').then(r => r.json()),
    ]).then(([b, arts]) => {
      setBriefing(b)
      setArticles(arts.slice(0, 6))
      setLoading(false)
    })
  }, [date])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 18, background: '#F3F4F6', borderRadius: 9, width: `${80 + Math.random() * 20}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    )
  }

  return (
    <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Back */}
      <button
        onClick={() => router.push('/news')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14, fontWeight: 600, marginBottom: 32, padding: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Industry News
      </button>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0A1A0F 0%, var(--accent-brand-dark) 100%)', borderRadius: 20, padding: '36px 40px', marginBottom: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(var(--accent-brand-rgb),0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Daily Briefing</div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: 'white', margin: '0 0 20px', lineHeight: 1.2 }}>
            {fmtDate(date)}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {briefing?.content ?? 'No briefing available for this date.'}
          </p>
          <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            Powered by Claude AI · For independent professionals
          </div>
        </div>
      </div>

      {/* Share / Subscribe */}
      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '18px 22px', marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 2 }}>Share this briefing</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Send the link to a fellow freelancer.</div>
        </div>
        <button
          onClick={copyLink}
          style={{ padding: '9px 20px', border: '1.5px solid #E5E7EB', borderRadius: 9, background: 'white', color: copied ? 'var(--accent-brand)' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Link
            </>
          )}
        </button>
      </div>

      {/* Today's top stories */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          Today's Top Stories
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles.map(a => {
            const color = CAT_COLORS[a.category] ?? '#6B7280'
            const bg = CAT_BG[a.category] ?? 'rgba(107,114,128,0.08)'
            return (
              <div key={a.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color }}>
                    {a.category}
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{a.source}</span>
                  <span style={{ fontSize: 12, color: '#D1D5DB' }}>·</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{relativeTime(a.published_at)}</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                  {a.title}
                </h3>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6B7280', lineHeight: 1.65,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.summary}
                </p>
                <a href={a.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent-brand)', fontWeight: 600, textDecoration: 'none' }}>
                  Read full article →
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
