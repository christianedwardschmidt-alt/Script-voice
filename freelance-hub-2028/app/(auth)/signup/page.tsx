'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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

  return (
    <div style={{ width: '100%' }}>
      {/* Founding member badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(202,138,4,0.08)',
        border: '1px solid rgba(202,138,4,0.25)',
        borderRadius: 99,
        padding: '5px 14px',
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 12, color: '#CA8A04', fontWeight: 600 }}>⚡ Founding member — 30 days free, 20% off for life</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-syne), Syne, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#111827',
          letterSpacing: '-0.02em',
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          Join GuildWire
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#16A34A', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
          padding: '12px 16px', fontSize: 13, color: '#DC2626', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
            Full name
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            autoFocus
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
            Email address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            width: '100%', padding: '13px',
            background: loading ? '#F3F4F6' : '#16A34A',
            color: loading ? '#9CA3AF' : '#fff',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-inter), inherit',
            boxShadow: loading ? 'none' : '0 2px 8px rgba(22,163,74,0.3)',
            transition: 'all 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (!loading) { (e.target as HTMLButtonElement).style.background = '#15803D' } }}
          onMouseLeave={e => { if (!loading) { (e.target as HTMLButtonElement).style.background = '#16A34A' } }}
        >
          {loading ? 'Creating your account…' : 'Claim your founding spot'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Terms of Service</a>
        {' '}and{' '}
        <a href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacy Policy</a>.
        No credit card required.
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #E5E7EB', borderRadius: 10,
  background: '#FAFAFA', fontSize: 14, color: '#111827',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
