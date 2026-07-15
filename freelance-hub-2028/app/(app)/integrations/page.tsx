'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// ── Abstract icon components (36×36, stroke-based) ────────────────────────────

function IconCoinArrow({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="23" r="8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 23h6M14.5 20.5h7M14.5 25.5h7" stroke={c} strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M18 15V8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 11l3-3 3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconReceiptCheck({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M9 29V7h14l5 5v17H9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M23 7v5h5" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M13 17h10M13 21h6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 25l2.5 2.5 4.5-4.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCalendarClock({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="7" width="24" height="20" rx="2.5" stroke={c} strokeWidth="1.8"/>
      <path d="M3 14h24" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 4v6M20 4v6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="28" cy="25" r="5.5" fill="white" stroke={c} strokeWidth="1.6"/>
      <path d="M28 22.5V25l2 1.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconEnvelopeSend({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="10" width="23" height="16" rx="2" stroke={c} strokeWidth="1.8"/>
      <path d="M3 12l11.5 8L26 12" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M31 18l-6-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 15l6 3-3 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconChatDots({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M4 5h28v21H20l-8 6V26H4z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="13" cy="16.5" r="2.2" fill={c}/>
      <circle cx="18" cy="16.5" r="2.2" fill={c}/>
      <circle cx="23" cy="16.5" r="2.2" fill={c}/>
    </svg>
  )
}

function IconAutomation({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M6 18c0-6.6 5.4-12 12-12 3.3 0 6.3 1.3 8.5 3.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M30 18c0 6.6-5.4 12-12 12-3.3 0-6.3-1.3-8.5-3.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M24.5 5.5L26.5 9H23" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 30.5L9.5 27H13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconFolderUpload({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M3 12h30v17a2 2 0 01-2 2H5a2 2 0 01-2-2V12z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M3 12V9a2 2 0 012-2h8l3 3h13a2 2 0 012 2v1" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M18 28v-9M15 22l3-3 3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconWaveCoin({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M3 13c2.5-4 5-6 7-6s4.5 6 7 6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="24" cy="23" r="8.5" stroke={c} strokeWidth="1.8"/>
      <path d="M21.5 23c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 17v1.5M24 26.5V28" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconLayers({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 5L4 12l14 7 14-7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M4 19l14 7 14-7" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 25.5l14 7 14-7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45"/>
    </svg>
  )
}

function IconDocumentList({ c }: { c: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M8 3h14l7 7v23H8z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M22 3v7h7" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 15h12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="19" width="3.5" height="3.5" rx="0.6" stroke={c} strokeWidth="1.4"/>
      <path d="M18 20.5h6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="12" y="24.5" width="3.5" height="3.5" rx="0.6" stroke={c} strokeWidth="1.4"/>
      <path d="M18 26h6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function IntegIcon({ icon, bg, border, color }: { icon: (p: { c: string }) => ReactNode; bg: string; border: string; color: string }) {
  const Icon = icon
  return (
    <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon c={color} />
    </div>
  )
}

function CheckGreen() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function LockGrey() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

type IconFn = (p: { c: string }) => ReactNode

interface IntegrationDef {
  id: string
  name: string
  category: string
  description: string
  features: [string, string, string]
  icon: IconFn
  iconColor: string
  iconBg: string
  iconBorder: string
  status: 'available' | 'coming_soon'
  permissions: string[]
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Sync payment data and auto-update invoice status when clients pay online.',
    features: ['Auto-mark invoices paid on charge', 'Revenue reconciliation reports', 'Refund & dispute tracking'],
    icon: IconCoinArrow,
    iconColor: '#6366F1', iconBg: 'rgba(99,102,241,0.08)', iconBorder: 'rgba(99,102,241,0.2)',
    status: 'available',
    permissions: ['View your payment transactions', 'Create and update invoices', 'Access payout & balance data'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Push invoices and expenses to QuickBooks for seamless year-end accounting.',
    features: ['Sync invoices & expenses automatically', 'Tax category mapping', 'Profit & loss reporting'],
    icon: IconReceiptCheck,
    iconColor: 'var(--accent-brand)', iconBg: 'rgba(var(--accent-brand-rgb),0.08)', iconBorder: 'rgba(var(--accent-brand-rgb),0.2)',
    status: 'available',
    permissions: ['Read your QuickBooks chart of accounts', 'Create and update transactions', 'Access financial reports'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Scheduling',
    description: 'Sync project deadlines, client meetings, and milestones with Google Calendar.',
    features: ['Two-way project deadline sync', 'Client meeting scheduling', 'Availability blocking'],
    icon: IconCalendarClock,
    iconColor: '#3B82F6', iconBg: 'rgba(59,130,246,0.08)', iconBorder: 'rgba(59,130,246,0.2)',
    status: 'available',
    permissions: ['View and create calendar events', 'Read your calendar availability', 'Send event invitations'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Send invoices and proposals directly from GuildWire via your Gmail account.',
    features: ['Send invoices from your Gmail', 'Track email open receipts', 'Archive client threads to CRM'],
    icon: IconEnvelopeSend,
    iconColor: '#0EA5E9', iconBg: 'rgba(14,165,233,0.08)', iconBorder: 'rgba(14,165,233,0.2)',
    status: 'available',
    permissions: ['Send email on your behalf', 'Read message headers & metadata', 'Access your Google contacts'],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Messaging',
    description: 'Get notified in Slack when invoices are paid, tasks are due, or deals close.',
    features: ['Payment & invoice notifications', 'Task due-date reminders', 'CRM deal-stage alerts'],
    icon: IconChatDots,
    iconColor: '#8B5CF6', iconBg: 'rgba(139,92,246,0.08)', iconBorder: 'rgba(139,92,246,0.2)',
    status: 'available',
    permissions: ['Post messages to your channels', 'Read your workspace channel list', 'Access your Slack profile'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect GuildWire to 5,000+ apps via Zapier to automate any part of your workflow.',
    features: ['Trigger zaps from invoice events', 'Auto-create CRM leads from forms', 'Webhook actions for any app'],
    icon: IconAutomation,
    iconColor: '#F97316', iconBg: 'rgba(249,115,22,0.08)', iconBorder: 'rgba(249,115,22,0.2)',
    status: 'available',
    permissions: ['Trigger webhooks on events', 'Read invoice & client data', 'Execute automation workflows'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'File Storage',
    description: 'Attach Dropbox files to invoices and auto-store signed contracts in the cloud.',
    features: ['Attach files to invoices & CRM', 'Auto-store signed contracts', 'Shared folder per client'],
    icon: IconFolderUpload,
    iconColor: '#2563EB', iconBg: 'rgba(37,99,235,0.08)', iconBorder: 'rgba(37,99,235,0.2)',
    status: 'available',
    permissions: ['Access your Dropbox files', 'Create and upload files', 'Share links from your account'],
  },
  {
    id: 'wave',
    name: 'Wave',
    category: 'Accounting',
    description: 'Free accounting integration for tracking income, expenses, and taxes effortlessly.',
    features: ['Sync income & expense records', 'Free tax preparation export', 'Bank reconciliation support'],
    icon: IconWaveCoin,
    iconColor: '#0D9488', iconBg: 'rgba(13,148,136,0.08)', iconBorder: 'rgba(13,148,136,0.2)',
    status: 'coming_soon',
    permissions: [],
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'Accounting',
    description: 'Enterprise accounting for high-volume freelancers with multi-currency support.',
    features: ['Multi-currency invoice sync', 'Automated payroll exports', 'Real-time cash flow reporting'],
    icon: IconLayers,
    iconColor: '#475569', iconBg: 'rgba(71,85,105,0.08)', iconBorder: 'rgba(71,85,105,0.2)',
    status: 'coming_soon',
    permissions: [],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Sync project briefs, client notes, and deliverables between GuildWire and Notion.',
    features: ['Auto-create project databases', 'Sync client notes to CRM', 'Deliverable checklist tracking'],
    icon: IconDocumentList,
    iconColor: '#374151', iconBg: 'rgba(55,65,81,0.07)', iconBorder: 'rgba(55,65,81,0.15)',
    status: 'coming_soon',
    permissions: [],
  },
]

const CAT_BG: Record<string, string> = {
  Payments: '#EEF2FF', Accounting: '#F0FDF4', Scheduling: '#EFF6FF',
  Email: '#F0F9FF', Messaging: '#F5F3FF', Automation: '#FFF7ED',
  'File Storage': '#EFF6FF', Productivity: '#F9FAFB',
}
const CAT_FG: Record<string, string> = {
  Payments: '#4F46E5', Accounting: '#15803D', Scheduling: '#2563EB',
  Email: '#0284C7', Messaging: '#7C3AED', Automation: '#EA580C',
  'File Storage': '#1D4ED8', Productivity: '#374151',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())
  const [modalId, setModalId] = useState<string | null>(null)

  // Google Calendar is the one integration with a real, persisted connection —
  // it gates the Calendar Trigger schedule type in the AI Agent builder.
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s?.google_calendar_connected) setConnectedIds(prev => new Set([...prev, 'google-calendar']))
    }).catch(() => {})
  }, [])

  const connectedList = INTEGRATIONS.filter(i => connectedIds.has(i.id))
  const availableList = INTEGRATIONS.filter(i => !connectedIds.has(i.id))
  const modal = modalId ? INTEGRATIONS.find(i => i.id === modalId) ?? null : null

  function connect(id: string) {
    setConnectedIds(prev => new Set([...prev, id]))
    setModalId(null)
    if (id === 'google-calendar') {
      fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ google_calendar_connected: true }) }).catch(() => {})
    }
  }
  function disconnect(id: string) {
    setConnectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    if (id === 'google-calendar') {
      fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ google_calendar_connected: false }) }).catch(() => {})
    }
  }

  const sectionLabel = (text: string, badge?: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{text}</span>
      {badge != null && badge > 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent-brand)', color: '#fff', borderRadius: 10, padding: '1px 7px', lineHeight: 1.5 }}>{badge}</span>
      )}
    </div>
  )

  return (
    <div className="page-pad" style={{ padding: '32px', background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
          Integrations
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280', margin: '6px 0 0' }}>
          Connect your tools to automate your freelance workflow.
        </p>
      </div>

      {/* ── Connected ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        {sectionLabel('Connected', connectedList.length)}

        {connectedList.length === 0 ? (
          <div style={{ padding: '24px 28px', border: '1px dashed #E5E7EB', borderRadius: 12, background: '#FAFAFA' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#9CA3AF', margin: 0 }}>
              No integrations connected yet — connect your tools below to automate your workflow.
            </p>
          </div>
        ) : (
          <div className="g-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {connectedList.map(integ => (
              <div key={integ.id} className="card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <IntegIcon icon={integ.icon} color={integ.iconColor} bg={integ.iconBg} border={integ.iconBorder} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{integ.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--accent-brand)', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-brand)', display: 'inline-block' }}/>
                      Connected
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>{integ.category}</div>
                  <button
                    onClick={() => disconnect(integ.id)}
                    style={{ marginTop: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6B7280' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Available ──────────────────────────────────────────────────────────── */}
      <div>
        {sectionLabel('Available Integrations')}
        <div className="g-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {availableList.map(integ => (
            <div key={integ.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <IntegIcon icon={integ.icon} color={integ.iconColor} bg={integ.iconBg} border={integ.iconBorder} />
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{integ.name}</div>
                  <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: CAT_FG[integ.category] ?? '#374151', background: CAT_BG[integ.category] ?? '#F9FAFB', borderRadius: 4, padding: '2px 7px' }}>
                    {integ.category}
                  </span>
                </div>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', lineHeight: 1.55, margin: '0 0 14px' }}>
                {integ.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {integ.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckGreen />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#374151', lineHeight: 1.45 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <div style={{ flex: 1 }} />

              {integ.status === 'available' ? (
                <button
                  onClick={() => setModalId(integ.id)}
                  style={{ padding: '9px 0', borderRadius: 9, background: '#111827', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1F2937')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
                >
                  Connect
                </button>
              ) : (
                <div style={{ padding: '9px 0', borderRadius: 9, background: '#F3F4F6', color: '#9CA3AF', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Connect Modal ─────────────────────────────────────────────────────── */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setModalId(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <IntegIcon icon={modal.icon} color={modal.iconColor} bg={modal.iconBg} border={modal.iconBorder} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                    Connect {modal.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>{modal.category}</div>
                </div>
              </div>
              <button
                onClick={() => setModalId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 0, marginTop: 2 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <CloseIcon />
              </button>
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
              {modal.description}
            </p>

            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
                Permissions Requested
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {modal.permissions.map(p => (
                  <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <LockGrey />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#374151', lineHeight: 1.4 }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setModalId(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: '#F3F4F6', color: '#374151', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}
              >
                Cancel
              </button>
              <button
                onClick={() => connect(modal.id)}
                style={{ flex: 2, padding: '10px 0', borderRadius: 9, background: 'var(--accent-brand)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-brand-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-brand)')}
              >
                Connect {modal.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
