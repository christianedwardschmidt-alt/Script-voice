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

const WORK_TYPES = ['Engineering', 'Design', 'Consulting', 'Writing', 'Strategy', 'Marketing', 'Other']

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', workType: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      let data: { error?: string; ok?: boolean } = {}
      try { data = await res.json() } catch { /* non-JSON response */ }
      if (!res.ok) { setError(data.error ?? `Server error ${res.status}`); return }
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error — check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Static progress: ~34% spots claimed
  const spotsPercent = 34

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

      {/* ── LEFT PANEL ──────────────────────── */}
      <div style={{
        background: '#0A1A0F',
        display: 'flex', flexDirection: 'column',
        padding: '40px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(22,163,74,0.07)', filter: 'blur(60px)',
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
          <div style={{ width: 48, height: 3, background: '#CA8A04', borderRadius: 99, marginBottom: 32 }} />

          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(28px, 3vw, 44px)', color: 'white',
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            Join the founding guild.
          </h2>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15,
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
            maxWidth: 360, marginBottom: 32,
          }}>
            Founding members get 30 days free, 20% off every plan forever, and early access to every feature we ship. These spots are going fast.
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Founding spots claimed</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#CA8A04' }}>{spotsPercent}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${spotsPercent}%`, height: '100%',
                background: 'linear-gradient(90deg, #92400E, #CA8A04)',
                borderRadius: 99,
                transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Offering limited founding member pricing to early adopters only
          </p>
        </div>

        {/* Benefits list */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
          {[
            { text: '30-day free trial — no credit card required' },
            { text: '20% off your chosen plan, forever' },
            { text: 'Full access to CRM, invoicing, AI & community' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────── */}
      <div style={{
        background: 'white',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Founding badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.3)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 20,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#CA8A04"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#92400E', letterSpacing: '0.02em' }}>FOUNDING MEMBER ACCESS</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 32, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6,
          }}>Create your account</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', marginBottom: 28 }}>
            Start your 30-day free trial — no card required
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)' }}>First name</label>
              <input
                type="text"
                required
                autoComplete="given-name"
                autoFocus
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.08)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Email address</label>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.08)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)' }}>What kind of work do you do?</label>
              <select
                value={form.workType}
                onChange={e => setForm({ ...form, workType: e.target.value })}
                style={{ ...inputBase, appearance: 'none', cursor: 'pointer', color: form.workType ? '#111827' : '#9CA3AF' }}
                onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.08)'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA' }}
              >
                <option value="" disabled>Select your field</option>
                {WORK_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Terms */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
              By creating an account you agree to our{' '}
              <Link href="#" style={{ color: '#16A34A', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>
              {' '}and{' '}
              <Link href="#" style={{ color: '#16A34A', fontWeight: 500, textDecoration: 'none' }}>Terms of Service</Link>.
            </p>

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
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? '#9CA3AF' : '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? 'Creating your account…' : 'Create my account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
