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
      <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading profile...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', marginBottom: 6 }}>Profile</h1>
      <p style={{ color: '#78716c', fontSize: 14, marginBottom: 24 }}>Manage your personal profile</p>
      <div className="card" style={{ padding: 28, maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700 }}>
            {profile.displayName?.charAt(0) ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>{profile.displayName}</div>
            <div style={{ fontSize: 14, color: '#78716c' }}>{profile.email}</div>
            <button style={{ marginTop: 8, padding: '5px 14px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, background: 'var(--card)', fontSize: 13, cursor: 'pointer', color: '#1c1917' }}>Change Photo</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Display Name</label>
            <input className="search-input" style={{ paddingLeft: 12 }} value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Email</label>
            <input className="search-input" style={{ paddingLeft: 12 }} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Headline</label>
            <input className="search-input" style={{ paddingLeft: 12 }} value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Skills</label>
            <input className="search-input" style={{ paddingLeft: 12 }} value={profile.skills} onChange={e => setProfile({ ...profile, skills: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 13, color: '#16a34a' }}>Saved!</span>}
          <button className="btn-primary" onClick={update}>Update Profile</button>
        </div>
      </div>
    </div>
  )
}
