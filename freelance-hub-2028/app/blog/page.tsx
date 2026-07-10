'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  slug: string
  category: string
  excerpt: string
  featured: number
  publish_date: string
  read_time: number
  author_name: string
  bookmarked: number
}

const CATEGORIES = ['All', 'Opinion', 'Practical', 'Personal', 'Industry']

const CAT_COLORS: Record<string, string> = {
  Opinion:  '#7C3AED',
  Practical: '#16A34A',
  Personal:  '#3B82F6',
  Industry:  '#F97316',
}

const CAT_BG: Record<string, string> = {
  Opinion:  'rgba(124,58,237,0.09)',
  Practical: 'rgba(22,163,74,0.09)',
  Personal:  'rgba(59,130,246,0.09)',
  Industry:  'rgba(249,115,22,0.09)',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => { if (r.ok) setIsLoggedIn(true) }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const qs = category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''
    fetch(`/api/blog${qs}`)
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [category])

  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => !p.featured || category !== 'All')

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>

      {/* Top nav */}
      <header style={{ borderBottom: '1px solid #E5E7EB', background: 'white', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>GuildWire</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>/ Blog</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isLoggedIn ? (
              <Link href="/dashboard" style={{ padding: '7px 16px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                ← Back to App
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', textDecoration: 'none' }}>Sign in</Link>
                <Link href="/register" style={{ padding: '7px 16px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px 44px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 12 }}>
            The GuildWire Journal
          </div>
          <h1 style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#0A1A0F', margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 640 }}>
            Perspectives for the modern independent professional.
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0, lineHeight: 1.7, maxWidth: 520 }}>
            Practical strategy, honest stories, and sharp takes on freelancing, consulting, and building a business you actually want.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ background: 'white', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 60, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                color: category === cat ? '#111827' : '#9CA3AF',
                borderBottom: category === cat ? '2px solid #16A34A' : '2px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 24px 80px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 120, background: 'white', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite', border: '1px solid #F3F4F6' }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.45} }`}</style>
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && category === 'All' && (
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0A1A0F 0%, #14532D 100%)',
                  borderRadius: 20,
                  padding: '40px 44px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 70% 20%, rgba(22,163,74,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, background: 'rgba(22,163,74,0.25)', color: '#4ADE80' }}>
                        Featured
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
                        {featured.category}
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: 'white', margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.01em', maxWidth: 620 }}>
                      {featured.title}
                    </h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', margin: '0 0 20px', lineHeight: 1.7, maxWidth: 540 }}>
                      {featured.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      <span>{featured.author_name}</span>
                      <span>·</span>
                      <span>{fmtDate(featured.publish_date)}</span>
                      <span>·</span>
                      <span>{featured.read_time} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article grid */}
            {rest.length === 0 && !featured ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>No posts in this category yet.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {rest.map(post => {
                  const color = CAT_COLORS[post.category] ?? '#6B7280'
                  const bg = CAT_BG[post.category] ?? 'rgba(107,114,128,0.09)'
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                      <article
                        style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', padding: '24px 24px 20px', height: '100%', boxSizing: 'border-box', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: bg, color }}>
                            {post.category}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 10px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.title}
                        </h3>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9CA3AF' }}>
                          <span>{fmtDate(post.publish_date)}</span>
                          <span>·</span>
                          <span>{post.read_time} min read</span>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E7EB', background: 'white', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>
          © {new Date().getFullYear()} GuildWire · Built for independent professionals
        </div>
      </footer>
    </div>
  )
}
