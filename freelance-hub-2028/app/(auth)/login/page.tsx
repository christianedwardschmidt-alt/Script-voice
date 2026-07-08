'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputBase: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #E5E7EB', borderRadius: 'var(--radius-md)',
  background: '#FAFAFA', fontSize: 14, color: '#111827',
  outline: 'none', fontFamily: 'var(--font-body)',
  transition: 'all 0.2s ease',
}

const members = [
  { initials: 'MR', bg: '#16A34A', name: 'Maya R.', role: 'Brand Designer' },
  { initials: 'JT', bg: '#3B82F6', name: 'James T.', role: 'Strategy Consultant' },
  { initials: 'SL', bg: '#8B5CF6', name: 'Sara L.', role: 'Frontend Engineer' },
]

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* ── LEFT PANEL ──────────────────────── */}
      <div style={{
        background: '#0A1A0F',
        display: 'flex', flexDirection: 'column',
        padding: '40px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(22,163,74,0.06)', filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
            <span style={{ color: 'white' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
          </span>
        </Link>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {/* Green accent line */}
          <div style={{ width: 48, height: 3, background: '#16A34A', borderRadius: 99, marginBottom: 32 }} />

          <blockquote style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(24px, 2.5vw, 40px)', color: 'white',
            lineHeight: 1.15, letterSpacing: '-0.02em',
            maxWidth: 400, marginBottom: 24,
          }}>
            &ldquo;Built by someone who went independent and felt everything you&apos;re feeling.&rdquo;
          </blockquote>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 16,
            color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 380,
          }}>
            GuildWire exists because independent work is the future — and you deserve tools that work as hard as you do.
          </p>
        </div>

        {/* Member proof */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map((m) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: m.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                  fontFamily: 'var(--font-body)',
                }}>{m.initials}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'white' }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{m.role}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#16A34A"><polyline points="20 6 9 17 4 12" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────── */}
      <div style={{
        background: 'white',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 32, color: '#111827', letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>Welcome back</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
            Sign in to your GuildWire account
          </p>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
              padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 20,
              fontFamily: 'var(--font-body)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.08)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#16A34A', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.08)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#9CA3AF' : '#16A34A',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow: loading ? 'none' : 'var(--shadow-green)',
                transition: 'all 0.2s ease', marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? '#9CA3AF' : '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#9CA3AF' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
