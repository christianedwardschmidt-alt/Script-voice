'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (data.token) {
        setResetLink(`${window.location.origin}/reset-password?token=${data.token}`)
      } else {
        // Email not found — still show success to avoid leaking existence
        setResetLink('__not_found__')
      }
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

  if (resetLink === '__not_found__') {
    return (
      <div style={{ width: '100%', maxWidth: 420 }}>
        {logoBlock}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 8 }}>Check your inbox</h1>
            <p style={{ fontSize: 14, color: 'rgba(15,17,23,0.5)', lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
            </p>
          </div>
          <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 14, color: '#16a34a', fontWeight: 600 }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (resetLink) {
    return (
      <div style={{ width: '100%', maxWidth: 420 }}>
        {logoBlock}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 8 }}>Reset link ready</h1>
            <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              In production this would arrive by email. For this demo, click the link below to reset your password. It expires in 1 hour.
            </p>
          </div>
          <a
            href={resetLink}
            style={{
              display: 'block', width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, textAlign: 'center',
              boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
              textDecoration: 'none',
            }}
          >
            Reset my password →
          </a>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(15,17,23,0.4)', marginBottom: 4 }}>Or copy the link:</div>
            <div style={{ fontSize: 11, color: '#16a34a', wordBreak: 'break-all', fontFamily: 'monospace' }}>{resetLink}</div>
          </div>
          <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(15,17,23,0.45)', fontWeight: 500 }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {logoBlock}
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 36px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f1117', marginBottom: 6 }}>Forgot your password?</h1>
        <p style={{ fontSize: 13, color: 'rgba(15,17,23,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(15,17,23,0.6)', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', padding: '12px',
              background: loading ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #15803d, #16a34a)',
              color: loading ? 'rgba(15,17,23,0.35)' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
            }}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <Link href="/login" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(15,17,23,0.45)', fontWeight: 500 }}>
          ← Back to sign in
        </Link>
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
