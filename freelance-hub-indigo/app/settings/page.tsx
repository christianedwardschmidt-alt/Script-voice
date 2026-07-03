'use client'

import { useEffect, useState } from 'react'

interface Settings {
  id: number
  notifications: boolean
  twoFactor: boolean
  darkMode: boolean
  invoiceAutoSend: boolean
  weeklyDigest: boolean
}

const items: { key: keyof Omit<Settings, 'id'>; title: string; desc: string }[] = [
  { key: 'notifications', title: 'Notifications', desc: 'Email and push notification preferences' },
  { key: 'twoFactor', title: 'Two-Factor Auth', desc: 'Add an extra layer of security' },
  { key: 'darkMode', title: 'Dark Mode', desc: 'Switch between light and dark theme' },
  { key: 'invoiceAutoSend', title: 'Invoice Auto-send', desc: 'Automatically send invoices on due date' },
  { key: 'weeklyDigest', title: 'Weekly Digest', desc: 'Receive a weekly summary of your activity' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
  }, [])

  const toggle = async (key: keyof Omit<Settings, 'id'>) => {
    if (!settings) return
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: next[key] }),
    })
  }

  if (!settings) {
    return (
      <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', marginBottom: 6 }}>Settings</h1>
      <p style={{ color: '#78716c', fontSize: 14, marginBottom: 24 }}>Configure your account preferences</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        {items.map(({ key, title, desc }) => {
          const on = settings[key]
          return (
            <div key={key} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{desc}</div>
              </div>
              <div
                onClick={() => toggle(key)}
                style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#4347a8' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          )
        })}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Danger Zone</div>
          <div style={{ fontSize: 12, color: '#78716c', marginBottom: 12 }}>These actions are irreversible. Please proceed with caution.</div>
          <button style={{ padding: '8px 16px', border: '1px solid #fecaca', borderRadius: 8, background: 'var(--card)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>Delete Account</button>
        </div>
      </div>
    </div>
  )
}
