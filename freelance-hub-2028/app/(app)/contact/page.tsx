'use client'

import { useEffect, useState } from 'react'

interface ContactInfo {
  id: number
  fullName: string
  email: string
  phone: string
  website: string
  location: string
  timezone: string
  bio: string
}

const fields: { key: keyof Omit<ContactInfo, 'id' | 'bio'>; label: string; type: string }[] = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'timezone', label: 'Timezone', type: 'text' },
]

export default function ContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/contact')
      .then(res => res.json())
      .then(setContact)
  }, [])

  const save = async () => {
    if (!contact) return
    const res = await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    const updated = await res.json()
    setContact(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!contact) {
    return (
      <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading contact info...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', marginBottom: 6 }}>Contact Info</h1>
      <p style={{ color: '#78716c', fontSize: 14, marginBottom: 24 }}>Your public freelancer profile information</p>
      <div className="card" style={{ padding: 28, maxWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type}
                className="search-input"
                style={{ paddingLeft: 12 }}
                value={contact[key]}
                onChange={e => setContact({ ...contact, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea
            placeholder="Tell clients about yourself..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, fontSize: 14, color: '#1c1917', resize: 'none', outline: 'none', minHeight: 80, fontFamily: 'inherit', background: 'var(--card)' }}
            value={contact.bio}
            onChange={e => setContact({ ...contact, bio: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 13, color: '#16a34a' }}>Saved!</span>}
          <button className="btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
