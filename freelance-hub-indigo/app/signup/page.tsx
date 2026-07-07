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
      try { data = await res.json() } catch { /* non-JSON */ }
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
    <div style={{ width: '100%', maxWidth: 440 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(22,163,74,0.3)', marginBottom: 14,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px' }}>GW</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          <span style={{ color: '#0d1017' }}>Guild</span><span style={{ color: '#16a34a' }}>Wire</span>
        </div>
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4, letterSpacing: '0.01em' }}>
          Work free. Stay connected.
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '32px 36px',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 6, letterSpacing: '-0.3px' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#16a34a', fontWeight: 600 }}>Sign in</Link>
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
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
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
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
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
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
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              width: '100%', padding: '12px',
              background: loading ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #15803d, #16a34a)',
              color: loading ? 'rgba(15,17,23,0.35)' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'rgba(15,17,23,0.35)', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10,
  background: '#fafafa', fontSize: 14, color: '#0f1117',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
