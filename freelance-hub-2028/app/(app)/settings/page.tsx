'use client'

import { useEffect, useState } from 'react'
import CollaboratorsPanel from './CollaboratorsPanel'

interface Settings {
  id: number
  notifications: boolean
  twoFactor: boolean
  darkMode: boolean
  invoiceAutoSend: boolean
  weeklyDigest: boolean
  work_start: string
  work_end: string
  work_days: string[]
}

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const items: { key: keyof Omit<Settings, 'id'>; title: string; desc: string }[] = [
  { key: 'notifications', title: 'Notifications', desc: 'Email and push notification preferences' },
  { key: 'twoFactor', title: 'Two-Factor Auth', desc: 'Add an extra layer of security' },
  { key: 'darkMode', title: 'Dark Mode', desc: 'Switch between light and dark theme' },
  { key: 'invoiceAutoSend', title: 'Invoice Auto-send', desc: 'Automatically send invoices on due date' },
  { key: 'weeklyDigest', title: 'Weekly Digest', desc: 'Receive a weekly summary of your activity' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<'general' | 'people'>('general')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restored, setRestored] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pwError, setPwError] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [resetUrl, setResetUrl] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
  }, [])

  const clearSampleData = async () => {
    setClearing(true)
    await fetch('/api/reset', { method: 'POST' })
    setClearing(false)
    setCleared(true)
    setRestored(false)
    setConfirm(false)
  }

  const restoreSampleData = async () => {
    setRestoring(true)
    await fetch('/api/restore', { method: 'POST' })
    setRestoring(false)
    setRestored(true)
    setCleared(false)
    setConfirmRestore(false)
  }

  const sendResetLink = async () => {
    setResetStatus('sending')
    setResetUrl('')
    const profile = await fetch('/api/profile').then(r => r.json())
    const email = profile?.email
    if (!email) { setResetStatus('idle'); return }
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.resetUrl) setResetUrl(data.resetUrl)
    setResetStatus('sent')
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    setPwStatus('saving')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    const data = await res.json()
    if (!res.ok) { setPwError(data.error ?? 'Failed'); setPwStatus('error'); return }
    setPwStatus('saved')
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwStatus('idle'), 3000)
  }

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

  const updateWorkingHours = async (patch: Partial<Pick<Settings, 'work_start' | 'work_end' | 'work_days'>>) => {
    if (!settings) return
    const next = { ...settings, ...patch }
    setSettings(next)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  const toggleWorkDay = (day: string) => {
    if (!settings) return
    const days = settings.work_days.includes(day) ? settings.work_days.filter(d => d !== day) : [...settings.work_days, day]
    updateWorkingHours({ work_days: days })
  }

  if (!settings) {
    return (
      <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14, fontFamily: 'var(--font-body)' }}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>Settings</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 14, marginBottom: 20 }}>Configure your account preferences</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['general', 'people'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '9px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: 'none',
              fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#111827' : '#6B7280',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              borderBottom: tab === t ? '2px solid #16A34A' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t === 'general' ? 'General' : 'People'}
          </button>
        ))}
      </div>

      {tab === 'people' && <CollaboratorsPanel />}

      {tab === 'general' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        {items.map(({ key, title, desc }) => {
          const on = settings[key]
          return (
            <div key={key} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 2 }}>{desc}</div>
              </div>
              <div
                onClick={() => toggle(key)}
                style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#16a34a' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          )
        })}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Working Hours</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Scheduled agents respect these hours — GuildWire will check before running anything outside them.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>Active from</span>
            <input type="time" value={settings.work_start} onChange={e => updateWorkingHours({ work_start: e.target.value })}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
            <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>to</span>
            <input type="time" value={settings.work_end} onChange={e => updateWorkingHours({ work_end: e.target.value })}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ALL_DAYS.map(day => {
              const on = settings.work_days.includes(day)
              return (
                <button key={day} onClick={() => toggleWorkDay(day)} type="button"
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    border: on ? '1.5px solid #16A34A' : '1.5px solid rgba(0,0,0,0.1)', background: on ? 'rgba(22,163,74,0.1)' : 'var(--bg)', color: on ? '#16A34A' : '#6B7280',
                  }}>
                  {day.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Change Password</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Update your account password. You&apos;ll stay logged in after changing it.</div>
          {pwStatus === 'saved' && (
            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, marginBottom: 12 }}>Password updated successfully!</div>
          )}
          {pwError && (
            <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px' }}>{pwError}</div>
          )}
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['current', 'next', 'confirm'] as const).map((field, i) => (
              <input
                key={field}
                type="password"
                required
                placeholder={i === 0 ? 'Current password' : i === 1 ? 'New password (min 8 chars)' : 'Confirm new password'}
                value={pwForm[field]}
                onChange={e => { setPwForm(f => ({ ...f, [field]: e.target.value })); setPwStatus('idle'); setPwError('') }}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}
              />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={pwStatus === 'saving'}
                className="btn-primary"
                style={{ opacity: pwStatus === 'saving' ? 0.6 : 1 }}
              >
                {pwStatus === 'saving' ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {resetStatus === 'sent' ? (
              resetUrl ? (
                <div>
                  <div style={{ fontSize: 12, color: '#78716c', marginBottom: 6 }}>No email service configured — use this link:</div>
                  <a href={resetUrl} style={{ display: 'block', wordBreak: 'break-all', fontSize: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 10px', color: '#16a34a', textDecoration: 'none', fontFamily: 'monospace', lineHeight: 1.5 }}>{resetUrl}</a>
                  <div style={{ fontSize: 11, color: '#78716c', marginTop: 6 }}>Link expires in 1 hour.</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#16a34a' }}>Reset link sent — check your email.</div>
              )
            ) : (
              <button
                type="button"
                onClick={sendResetLink}
                disabled={resetStatus === 'sending'}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: '#16a34a', cursor: resetStatus === 'sending' ? 'not-allowed' : 'pointer', textDecoration: 'underline', fontFamily: 'inherit', opacity: resetStatus === 'sending' ? 0.6 : 1 }}
              >
                {resetStatus === 'sending' ? 'Sending…' : "Don't know your current password? Send a reset link to your email"}
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>Danger Zone</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginBottom: 16 }}>These actions are irreversible. Please proceed with caution.</div>

          {/* Clear sample data */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Clear all sample data</div>
            <div style={{ fontSize: 12, color: '#78716c', marginBottom: 10 }}>
              Removes all clients, tasks, invoices, CRM contacts, posts, calendar events, and tax records. Your profile and settings are kept.
            </div>
            {cleared ? (
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>All sample data cleared. Start adding your own!</div>
            ) : confirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#78716c' }}>Are you sure?</span>
                <button
                  onClick={clearSampleData}
                  disabled={clearing}
                  style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: '#ef4444', fontSize: 12, color: '#fff', cursor: clearing ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: clearing ? 0.6 : 1 }}
                >
                  {clearing ? 'Clearing…' : 'Yes, clear everything'}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--card)', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirm(true)}
                style={{ padding: '7px 16px', border: '1px solid #fecaca', borderRadius: 8, background: 'var(--card)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
              >
                Clear all sample data
              </button>
            )}
          </div>

          {/* Restore sample data */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Restore sample data</div>
            <div style={{ fontSize: 12, color: '#78716c', marginBottom: 10 }}>
              Brings back all the original sample clients, tasks, invoices, CRM contacts, posts, calendar events, and tax records.
            </div>
            {restored ? (
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Sample data restored!</div>
            ) : confirmRestore ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#78716c' }}>This will overwrite your current data.</span>
                <button
                  onClick={restoreSampleData}
                  disabled={restoring}
                  style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: '#16a34a', fontSize: 12, color: '#fff', cursor: restoring ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: restoring ? 0.6 : 1 }}
                >
                  {restoring ? 'Restoring…' : 'Yes, restore'}
                </button>
                <button
                  onClick={() => setConfirmRestore(false)}
                  style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--card)', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRestore(true)}
                style={{ padding: '7px 16px', border: '1px solid #bbf7d0', borderRadius: 8, background: 'var(--card)', fontSize: 13, color: '#16a34a', cursor: 'pointer', fontWeight: 500 }}
              >
                Restore sample data
              </button>
            )}
          </div>

          <button style={{ padding: '8px 16px', border: '1px solid #fecaca', borderRadius: 8, background: 'var(--card)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>Delete Account</button>
        </div>
      </div>
      )}
    </div>
  )
}
