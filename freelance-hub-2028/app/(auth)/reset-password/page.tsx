'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Missing reset token. Request a new link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      let data: { ok?: boolean; error?: string } = {}
      try { data = await res.json() } catch { /* */ }
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); setStatus('idle'); return }
      setStatus('done')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error')
      setStatus('idle')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10,
    background: '#fafafa', fontSize: 14, color: '#0f1117',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #007a3a, #00b857)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,184,87,0.3)', marginBottom: 14,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px' }}>GW</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#0A1A0F' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
        </div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px',
      }}>
        {status === 'done' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f1117', marginBottom: 8 }}>Password updated!</h1>
            <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.6)' }}>Redirecting you to sign in…</p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 6, letterSpacing: '-0.3px' }}>
              Set new password
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 24 }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18,
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
                  New password
                </label>
                <input
                  type="password" required autoFocus autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
                  Confirm password
                </label>
                <input
                  type="password" required autoComplete="new-password"
                  placeholder="Same password again"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit" disabled={status === 'loading' || !token}
                style={{
                  width: '100%', padding: '12px',
                  background: (status === 'loading' || !token) ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #007a3a, #00b857)',
                  color: (status === 'loading' || !token) ? 'rgba(15,17,23,0.35)' : '#fff',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: (status === 'loading' || !token) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {status === 'loading' ? 'Saving…' : 'Update password'}
              </button>
            </form>
            <Link href="/login" style={{
              display: 'block', textAlign: 'center', marginTop: 20,
              fontSize: 13, color: '#16A34A', fontWeight: 600, textDecoration: 'none',
            }}>← Back to sign in</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
