'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: 'var(--font-syne), Syne, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#111827',
          letterSpacing: '-0.02em',
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#16A34A', fontWeight: 600 }}>Start your free trial</Link>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Forgot password?</Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
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
          {loading ? 'Signing in…' : 'Sign in to GuildWire'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
        By signing in you agree to our{' '}
        <a href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Terms</a>
        {' '}and{' '}
        <a href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacy Policy</a>.
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
