'use client'

import { useEffect, useState } from 'react'

interface Profile {
  id: number
  displayName: string
  email: string
  headline: string
  skills: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(setProfile)
  }, [])

  const update = async () => {
    if (!profile) return
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const updated = await res.json()
    setProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!profile) {
    return (
      <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Profile</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 14, marginBottom: 28 }}>Manage your personal information</p>
      <div className="card" style={{ padding: 28, maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #14532D, #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
            {profile.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{profile.displayName}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', marginTop: 2 }}>{profile.email}</div>
            <button style={{ marginTop: 8, padding: '5px 14px', border: '1px solid #E5E7EB', borderRadius: 'var(--radius-md)', background: 'white', fontSize: 12, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all 0.2s ease' }}>Change Photo</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(['displayName', 'email', 'headline', 'skills'] as const).map((field) => (
            <div key={field}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                {field === 'displayName' ? 'Display Name' : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                className="search-input"
                style={{ paddingLeft: 12, fontFamily: 'var(--font-body)' }}
                value={(profile as Record<string, string>)[field]}
                onChange={e => setProfile({ ...profile, [field]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#16A34A', fontWeight: 500 }}>Saved!</span>}
          <button className="btn-primary" onClick={update}>Update Profile</button>
        </div>
      </div>
    </div>
  )
}
