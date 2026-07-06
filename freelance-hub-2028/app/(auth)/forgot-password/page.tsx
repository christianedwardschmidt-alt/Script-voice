'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      let data: { ok?: boolean; emailSent?: boolean; resetUrl?: string | null; error?: string } = {}
      try { data = await res.json() } catch { /* */ }
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); setStatus('idle'); return }
      if (data.resetUrl) setResetUrl(data.resetUrl)
      setStatus('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error')
      setStatus('idle')
    }
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
          <div>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>✅</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f1117', marginBottom: 8, textAlign: 'center' }}>
              Check your email
            </h1>
            {resetUrl ? (
              <div>
                <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.6)', marginBottom: 16, textAlign: 'center' }}>
                  No email service configured — use this link to reset your password:
                </p>
                <a
                  href={resetUrl}
                  style={{
                    display: 'block', wordBreak: 'break-all', fontSize: 12,
                    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
                    padding: '10px 12px', color: '#16a34a', textDecoration: 'none',
                    fontFamily: 'monospace', lineHeight: 1.5,
                  }}
                >
                  {resetUrl}
                </a>
                <p style={{ fontSize: 11, color: 'rgba(15,17,23,0.4)', marginTop: 10, textAlign: 'center' }}>
                  This link expires in 1 hour.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.6)', textAlign: 'center' }}>
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
              </p>
            )}
            <Link href="/login" style={{
              display: 'block', textAlign: 'center', marginTop: 20,
              fontSize: 13, color: '#16A34A', fontWeight: 600, textDecoration: 'none',
            }}>← Back to sign in</Link>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 6, letterSpacing: '-0.3px' }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 24 }}>
              Enter your email and we&apos;ll send you a reset link.
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
                  Email address
                </label>
                <input
                  type="email" required autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10,
                    background: '#fafafa', fontSize: 14, color: '#0f1117',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              <button
                type="submit" disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '12px',
                  background: status === 'loading' ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #007a3a, #00b857)',
                  color: status === 'loading' ? 'rgba(15,17,23,0.35)' : '#fff',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Send reset link'}
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
