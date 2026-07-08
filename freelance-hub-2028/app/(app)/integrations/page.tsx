'use client'

import { useState } from 'react'

// ── Logo badge ────────────────────────────────────────────────────────────────

function LogoBadge({ bg, fg = '#fff', text, size = 44, radius = 12, textSize = 16 }: {
  bg: string; fg?: string; text: string; size?: number; radius?: number; textSize?: number
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        color: fg, fontSize: textSize, fontWeight: 800,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
        userSelect: 'none',
      }}>{text}</span>
    </div>
  )
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function CheckGreen() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
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

interface IntegrationDef {
  id: string
  name: string
  category: string
  description: string
  features: [string, string, string]
  logoBg: string
  logoText: string
  logoFg?: string
  logoTextSize?: number
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
    logoBg: '#635BFF', logoText: 'S',
    status: 'available',
    permissions: ['View your payment transactions', 'Create and update invoices', 'Access payout & balance data'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Push invoices and expenses to QuickBooks for seamless year-end accounting.',
    features: ['Sync invoices & expenses automatically', 'Tax category mapping', 'Profit & loss reporting'],
    logoBg: '#2CA01C', logoText: 'QB', logoTextSize: 13,
    status: 'available',
    permissions: ['Read your QuickBooks chart of accounts', 'Create and update transactions', 'Access financial reports'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Scheduling',
    description: 'Sync project deadlines, client meetings, and milestones with Google Calendar.',
    features: ['Two-way project deadline sync', 'Client meeting scheduling', 'Availability blocking'],
    logoBg: '#4285F4', logoText: 'GC', logoTextSize: 13,
    status: 'available',
    permissions: ['View and create calendar events', 'Read your calendar availability', 'Send event invitations'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Send invoices and proposals directly from GuildWire via your Gmail account.',
    features: ['Send invoices from your Gmail', 'Track email open receipts', 'Archive client threads to CRM'],
    logoBg: '#EA4335', logoText: 'G',
    status: 'available',
    permissions: ['Send email on your behalf', 'Read message headers & metadata', 'Access your Google contacts'],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Messaging',
    description: 'Get notified in Slack when invoices are paid, tasks are due, or deals close.',
    features: ['Payment & invoice notifications', 'Task due-date reminders', 'CRM deal-stage alerts'],
    logoBg: '#4A154B', logoText: '#', logoTextSize: 22,
    status: 'available',
    permissions: ['Post messages to your channels', 'Read your workspace channel list', 'Access your Slack profile'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect GuildWire to 5,000+ apps via Zapier to automate any part of your workflow.',
    features: ['Trigger zaps from invoice events', 'Auto-create CRM leads from forms', 'Webhook actions for any app'],
    logoBg: '#FF4A00', logoText: 'Z',
    status: 'available',
    permissions: ['Trigger webhooks on events', 'Read invoice & client data', 'Execute automation workflows'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'File Storage',
    description: 'Attach Dropbox files to invoices and auto-store signed contracts in the cloud.',
    features: ['Attach files to invoices & CRM', 'Auto-store signed contracts', 'Shared folder per client'],
    logoBg: '#0061FF', logoText: 'Db', logoTextSize: 14,
    status: 'available',
    permissions: ['Access your Dropbox files', 'Create and upload files', 'Share links from your account'],
  },
  {
    id: 'wave',
    name: 'Wave',
    category: 'Accounting',
    description: 'Free accounting integration for tracking income, expenses, and taxes effortlessly.',
    features: ['Sync income & expense records', 'Free tax preparation export', 'Bank reconciliation support'],
    logoBg: '#00A2E0', logoText: 'W',
    status: 'coming_soon',
    permissions: [],
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'Accounting',
    description: 'Enterprise accounting for high-volume freelancers with multi-currency support.',
    features: ['Multi-currency invoice sync', 'Automated payroll exports', 'Real-time cash flow reporting'],
    logoBg: '#13B5EA', logoText: 'X',
    status: 'coming_soon',
    permissions: [],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Sync project briefs, client notes, and deliverables between GuildWire and Notion.',
    features: ['Auto-create project databases', 'Sync client notes to CRM', 'Deliverable checklist tracking'],
    logoBg: '#191919', logoText: 'N',
    status: 'coming_soon',
    permissions: [],
  },
]

const CAT_BG: Record<string, string> = {
  Payments: '#EEF2FF', Accounting: '#F0FDF4', Scheduling: '#EFF6FF',
  Email: '#FEF2F2', Messaging: '#F5F3FF', Automation: '#FFF7ED',
  'File Storage': '#EFF6FF', Productivity: '#F9FAFB',
}
const CAT_FG: Record<string, string> = {
  Payments: '#4F46E5', Accounting: '#15803D', Scheduling: '#2563EB',
  Email: '#DC2626', Messaging: '#7C3AED', Automation: '#EA580C',
  'File Storage': '#1D4ED8', Productivity: '#374151',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())
  const [modalId, setModalId] = useState<string | null>(null)

  const connectedList = INTEGRATIONS.filter(i => connectedIds.has(i.id))
  const availableList = INTEGRATIONS.filter(i => !connectedIds.has(i.id))
  const modal = modalId ? INTEGRATIONS.find(i => i.id === modalId) ?? null : null

  function connect(id: string) { setConnectedIds(prev => new Set([...prev, id])); setModalId(null) }
  function disconnect(id: string) { setConnectedIds(prev => { const s = new Set(prev); s.delete(id); return s }) }

  const sectionLabel = (text: string, badge?: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF',
      }}>{text}</span>
      {badge != null && badge > 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, background: '#16A34A', color: '#fff', borderRadius: 10, padding: '1px 7px', lineHeight: 1.5 }}>
          {badge}
        </span>
      )}
    </div>
  )

  return (
    <div style={{ padding: '32px', background: 'var(--bg)', minHeight: '100dvh' }}>

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
          <div style={{
            padding: '24px 28px', border: '1px dashed #E5E7EB', borderRadius: 12,
            background: '#FAFAFA',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#9CA3AF', margin: 0 }}>
              No integrations connected yet — connect your tools below to automate your workflow.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {connectedList.map(integ => (
              <div key={integ.id} className="card" style={{ padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <LogoBadge bg={integ.logoBg} text={integ.logoText} textSize={integ.logoTextSize} fg={integ.logoFg} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{integ.name}</span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, color: '#16A34A',
                      background: '#F0FDF4', border: '1px solid #BBF7D0',
                      borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}/>
                      Connected
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                    {integ.category}
                  </div>
                  <button
                    onClick={() => disconnect(integ.id)}
                    style={{
                      marginTop: 12, padding: '5px 12px', borderRadius: 7,
                      border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {availableList.map(integ => (
            <div key={integ.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <LogoBadge bg={integ.logoBg} text={integ.logoText} textSize={integ.logoTextSize} fg={integ.logoFg} />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{integ.name}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: CAT_FG[integ.category] ?? '#374151',
                    background: CAT_BG[integ.category] ?? '#F9FAFB',
                    borderRadius: 4, padding: '2px 7px',
                  }}>{integ.category}</span>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', lineHeight: 1.55, margin: '0 0 14px' }}>
                {integ.description}
              </p>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {integ.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckGreen />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#374151', lineHeight: 1.45 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Spacer pushes button to bottom */}
              <div style={{ flex: 1 }} />

              {/* CTA */}
              {integ.status === 'available' ? (
                <button
                  onClick={() => setModalId(integ.id)}
                  style={{
                    padding: '9px 0', borderRadius: 9, background: '#111827', color: '#fff',
                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1F2937')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
                >
                  Connect
                </button>
              ) : (
                <div style={{
                  padding: '9px 0', borderRadius: 9, background: '#F3F4F6', color: '#9CA3AF',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', textAlign: 'center',
                }}>
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
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setModalId(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: '32px',
              width: '100%', maxWidth: 440,
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <LogoBadge bg={modal.logoBg} text={modal.logoText} textSize={modal.logoTextSize} fg={modal.logoFg} size={48} radius={14} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                    Connect {modal.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>{modal.category}</div>
                </div>
              </div>
              <button
                onClick={() => setModalId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Description */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
              {modal.description}
            </p>

            {/* Permissions */}
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12,
              }}>
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setModalId(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 9, background: '#F3F4F6',
                  color: '#374151', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}
              >
                Cancel
              </button>
              <button
                onClick={() => connect(modal.id)}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 9, background: '#16A34A',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#15803D')}
                onMouseLeave={e => (e.currentTarget.style.background = '#16A34A')}
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
