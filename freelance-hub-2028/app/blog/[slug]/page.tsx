'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  featured: number
  publish_date: string
  read_time: number
  author_name: string
  author_title: string
  bookmarked: number
  reading_progress: number
}

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

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const progressSavedRef = useRef(0)

  useEffect(() => {
    fetch('/api/profile').then(r => { if (r.ok) setIsLoggedIn(true) }).catch(() => {})
    fetch(`/api/blog/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setPost(data)
          setBookmarked(!!data.bookmarked)
          setScrollProgress(data.reading_progress ?? 0)
        }
        setLoading(false)
      })
  }, [slug])

  const saveProgress = useCallback((progress: number) => {
    if (!post?.id) return
    if (Math.abs(progress - progressSavedRef.current) < 5) return
    progressSavedRef.current = progress
    fetch('/api/blog/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, progress }),
    }).catch(() => {})
  }, [post?.id])

  useEffect(() => {
    function onScroll() {
      const el = contentRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight
      const scrolled = Math.max(0, -rect.top)
      const pct = Math.min(100, Math.round((scrolled / total) * 100))
      setScrollProgress(pct)
      setShowShare(scrolled > 200)
      saveProgress(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [saveProgress])

  async function toggleBookmark() {
    if (!post) return
    if (bookmarked) {
      await fetch(`/api/blog/bookmarks/${post.id}`, { method: 'DELETE' })
      setBookmarked(false)
    } else {
      await fetch('/api/blog/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      setBookmarked(true)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 18, background: '#F3F4F6', borderRadius: 9, marginBottom: 12, width: `${60 + Math.random() * 40}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      </div>
    )
  }

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#F3F4F6', fontFamily: 'var(--font-display, sans-serif)' }}>404</div>
          <div style={{ fontSize: 16, color: '#6B7280', marginBottom: 20 }}>Post not found.</div>
          <Link href="/blog" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>← Back to Blog</Link>
        </div>
      </div>
    )
  }

  const catColor = CAT_COLORS[post.category] ?? '#6B7280'
  const catBg = CAT_BG[post.category] ?? 'rgba(107,114,128,0.09)'

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>

      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#F3F4F6', zIndex: 100 }}>
        <div style={{ height: '100%', background: '#16A34A', width: `${scrollProgress}%`, transition: 'width 0.1s linear' }} />
      </div>

      {/* Floating share bar */}
      <div style={{
        position: 'fixed', left: '50%', bottom: 32,
        background: '#111827', borderRadius: 50, padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        opacity: showShare ? 1 : 0, pointerEvents: showShare ? 'auto' : 'none',
        transition: 'opacity 0.25s, transform 0.25s',
        transform: showShare ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
        zIndex: 90,
      }}>
        <button
          onClick={toggleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Save post'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 24, color: bookmarked ? '#4ADE80' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, transition: 'color 0.15s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {bookmarked ? 'Saved' : 'Save'}
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
        <button
          onClick={copyLink}
          title="Copy link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 24, color: copied ? '#4ADE80' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, transition: 'color 0.15s' }}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          )}
          {copied ? 'Copied!' : 'Share'}
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
        <Link href="/blog" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 24, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          All posts
        </Link>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5E7EB', background: 'white', position: 'sticky', top: 3, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/blog" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>GuildWire</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>/ Blog</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoggedIn ? (
              <Link href="/dashboard" style={{ padding: '7px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Back to App
              </Link>
            ) : (
              <Link href="/register" style={{ padding: '7px 14px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Get started free
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Article */}
      <article ref={contentRef} style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Category + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 20, background: catBg, color: catColor }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{fmtDate(post.publish_date)}</span>
          <span style={{ color: '#E5E7EB' }}>·</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{post.read_time} min read</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display, var(--font-syne, sans-serif))',
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          color: '#0A1A0F',
          margin: '0 0 18px',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        <p style={{ fontSize: 17, color: '#4B5563', margin: '0 0 32px', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid #16A34A', paddingLeft: 20 }}>
          {post.excerpt}
        </p>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0A1A0F 0%, #16A34A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>{(post.author_name ?? 'C')[0]}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{post.author_name}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{post.author_title}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={toggleBookmark}
              style={{ background: bookmarked ? 'rgba(22,163,74,0.08)' : 'white', border: `1.5px solid ${bookmarked ? '#16A34A' : '#E5E7EB'}`, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: bookmarked ? '#16A34A' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {bookmarked ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={copyLink}
              style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: copied ? '#16A34A' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{ fontSize: 16.5, lineHeight: 1.85, color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author card */}
        <div style={{ marginTop: 60, background: '#F9FAFB', borderRadius: 16, padding: '28px 32px', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0A1A0F 0%, #16A34A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{(post.author_name ?? 'C')[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{post.author_name}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>{post.author_title}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.7 }}>
            Founder of GuildWire — a platform built for independent professionals who want to run their work like a real business. Former consultant turned builder.
          </p>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 28, background: 'linear-gradient(135deg, #0A1A0F 0%, #14532D 100%)', borderRadius: 16, padding: '32px 36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 70% 20%, rgba(22,163,74,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>Built for independents</div>
            <h3 style={{ fontFamily: 'var(--font-display, var(--font-syne, sans-serif))', fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
              Run your freelance business like a pro.
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: '0 0 20px', lineHeight: 1.65 }}>
              Proposals, invoices, CRM, AI companion, and more — everything you need to build a business you're proud of.
            </p>
            <Link
              href="/register"
              style={{ display: 'inline-block', padding: '11px 24px', background: '#16A34A', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'background 0.15s' }}
            >
              Get started free →
            </Link>
          </div>
        </div>

        {/* Back to blog */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link href="/blog" style={{ fontSize: 14, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to all posts
          </Link>
        </div>

      </article>

      <style>{`
        article h2 {
          font-family: var(--font-display, var(--font-syne, sans-serif));
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 40px 0 14px;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        article h3 {
          font-family: var(--font-display, var(--font-syne, sans-serif));
          font-size: 18px;
          font-weight: 700;
          color: #1F2937;
          margin: 28px 0 10px;
        }
        article p {
          margin: 0 0 20px;
        }
        article blockquote {
          border-left: 3px solid #16A34A;
          margin: 28px 0;
          padding: 12px 24px;
          background: rgba(22,163,74,0.05);
          border-radius: 0 8px 8px 0;
          font-style: italic;
          font-size: 16px;
          color: #374151;
          line-height: 1.75;
        }
        article ul, article ol {
          padding-left: 24px;
          margin: 0 0 20px;
        }
        article li {
          margin-bottom: 6px;
          line-height: 1.7;
        }
      `}</style>
    </div>
  )
}
