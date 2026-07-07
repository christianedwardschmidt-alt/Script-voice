'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError('Missing reset token. Please request a new link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const logoBlock = (
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
      <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
        Work free. Stay connected.
      </div>
    </div>
  )

  if (done) {
    return (
      <div style={{ width: '100%', maxWidth: 420 }}>
        {logoBlock}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 8 }}>Password updated!</h1>
          <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', lineHeight: 1.6 }}>
            Redirecting you to sign in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {logoBlock}
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 6 }}>Set a new password</h1>
        <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 24 }}>
          Must be at least 8 characters.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
            {error}
            {(error.includes('expired') || error.includes('Invalid')) && (
              <div style={{ marginTop: 8 }}>
                <Link href="/forgot-password" style={{ color: '#dc2626', fontWeight: 600 }}>Request a new link →</Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
              New password
            </label>
            <input
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
              Confirm password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            style={{
              marginTop: 4, width: '100%', padding: '12px',
              background: (loading || !token) ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #15803d, #16a34a)',
              color: (loading || !token) ? 'rgba(15,17,23,0.35)' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: (loading || !token) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: (loading || !token) ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
            }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(15,17,23,0.45)', fontWeight: 500 }}>
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10,
  background: '#fafafa', fontSize: 14, color: '#0f1117',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
