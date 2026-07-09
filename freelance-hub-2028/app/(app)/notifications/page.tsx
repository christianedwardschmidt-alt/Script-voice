'use client'

import { useState } from 'react'
import { Bell, CreditCard, Users, CheckSquare, TrendingUp, MessageCircle, Briefcase } from 'lucide-react'

interface NotifSetting {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  desc: string
  email: boolean
  push: boolean
}

const DEFAULTS: NotifSetting[] = [
  { id: 'invoice_paid',    icon: CreditCard,    iconColor: '#16A34A', title: 'Invoice paid',          desc: 'When a client pays an invoice',                email: true,  push: true  },
  { id: 'invoice_overdue', icon: CreditCard,    iconColor: '#EF4444', title: 'Invoice overdue',        desc: 'When an invoice passes its due date',           email: true,  push: true  },
  { id: 'new_client',      icon: Users,         iconColor: '#3B82F6', title: 'New client added',       desc: 'When a new client is created in your CRM',      email: false, push: true  },
  { id: 'task_due',        icon: CheckSquare,   iconColor: '#F59E0B', title: 'Task due reminder',      desc: '24 hours before a task deadline',               email: true,  push: true  },
  { id: 'crm_stage',       icon: TrendingUp,    iconColor: '#8B5CF6', title: 'Deal stage change',      desc: 'When a CRM deal moves to a new pipeline stage', email: false, push: false },
  { id: 'community_reply', icon: MessageCircle, iconColor: '#EC4899', title: 'Community reply',        desc: 'When someone replies to your post',             email: false, push: true  },
  { id: 'job_match',       icon: Briefcase,     iconColor: '#0EA5E9', title: 'New job match',          desc: 'Jobs that match your saved search criteria',    email: true,  push: false },
  { id: 'weekly_digest',   icon: Bell,          iconColor: '#6366F1', title: 'Weekly digest',          desc: 'A summary of your activity every Monday',       email: true,  push: false },
]

const card = { background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? '#16A34A' : '#E5E7EB',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
        padding: 0,
      }}
      aria-checked={on}
      role="switch"
    >
      <span style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotifSetting[]>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  const toggle = (id: string, channel: 'email' | 'push') => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s))
    setSaved(false)
  }

  const save = () => setSaved(true)

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Notifications</h1>
          <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 15, marginTop: 2 }}>Choose when and how you want to be notified.</p>
        </div>
        <button
          onClick={save}
          style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 20px', background: saved ? '#F0FDF4' : '#16A34A', color: saved ? '#16A34A' : '#fff', border: saved ? '1px solid #BBF7D0' : 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
        >
          {saved ? '✓ Saved' : 'Save preferences'}
        </button>
      </div>

      {/* Channel legend */}
      <div style={{ ...card, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Notification channels:</span>
        {[{ label: 'Email', color: '#3B82F6' }, { label: 'Push', color: '#8B5CF6' }].map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Notification rows */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 24px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Notification</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3B82F6', fontFamily: 'var(--font-body)', textAlign: 'center' }}>Email</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8B5CF6', fontFamily: 'var(--font-body)', textAlign: 'center' }}>Push</span>
        </div>

        {settings.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={s.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                padding: '16px 24px', alignItems: 'center',
                borderBottom: i < settings.length - 1 ? '1px solid #F9FAFB' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.iconColor}12`, border: `1px solid ${s.iconColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={s.iconColor} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={s.email} onChange={() => toggle(s.id, 'email')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={s.push} onChange={() => toggle(s.id, 'push')} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Global mute */}
      <div style={{ ...card, padding: '16px 20px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>Do not disturb</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>Pause all push notifications. Emails still send.</div>
        </div>
        <Toggle on={false} onChange={() => {}} />
      </div>
    </div>
  )
}
