'use client'

import { useState } from 'react'
import { Check, CreditCard, Download, Zap, Shield, Users, TrendingUp } from 'lucide-react'

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: 0,
    desc: 'For freelancers just getting started.',
    features: ['Up to 3 active clients', '5 invoices/month', 'Basic CRM', 'Community access'],
    cta: 'Current plan',
    current: false,
  },
  {
    id: 'founding',
    name: 'Founding Member',
    price: 19,
    originalPrice: 39,
    desc: 'Everything you need. Locked in for life.',
    features: ['Unlimited clients & invoices', 'Full CRM + pipeline', 'AI Assistant', 'Tax center', 'Priority support', 'Founding badge'],
    cta: 'Current plan',
    current: true,
    badge: 'Your plan',
  },
  {
    id: 'team',
    name: 'Team',
    price: 49,
    desc: 'For agencies and freelance collectives.',
    features: ['Everything in Founding', 'Up to 5 team members', 'Shared client workspace', 'Team analytics', 'Dedicated onboarding'],
    cta: 'Upgrade',
    current: false,
  },
]

const HISTORY = [
  { id: 'INV-2026-06', date: 'Jun 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
  { id: 'INV-2026-05', date: 'May 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
  { id: 'INV-2026-04', date: 'Apr 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
  { id: 'INV-2026-03', date: 'Mar 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
  { id: 'INV-2026-02', date: 'Feb 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
  { id: 'INV-2026-01', date: 'Jan 1, 2026', amount: 19.00, status: 'Paid',   desc: 'Founding Member · Monthly' },
]

const card = { background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }

export default function BillingPage() {
  const [showCard, setShowCard] = useState(false)

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Billing</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 15, marginTop: 2 }}>Manage your plan, payment method, and billing history.</p>
      </div>

      {/* Current plan banner */}
      <div style={{ ...card, background: 'linear-gradient(135deg, #14532D 0%, #15803D 100%)', padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>Active Plan</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: '#FCD34D', color: '#92400E', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-body)' }}>Founding Member</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            $19<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>/month</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through', marginLeft: 10 }}>$39</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontFamily: 'var(--font-body)' }}>Renews Jul 1, 2026 · Rate locked for life</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowCard(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            <CreditCard size={14} /> Update card
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#fff', color: '#15803D', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <Zap size={14} /> Upgrade to Team
          </button>
        </div>
      </div>

      <div className="g-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Payment method */}
          <div style={{ ...card, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 16 }}>Payment Method</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 32, background: '#1A1F71', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
                    <rect width="28" height="18" rx="3" fill="#1A1F71"/>
                    <circle cx="10" cy="9" r="5.5" fill="#EB001B"/>
                    <circle cx="18" cy="9" r="5.5" fill="#F79E1B"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M14 13.18A5.49 5.49 0 0112.5 9a5.49 5.49 0 011.5-4.18A5.49 5.49 0 0115.5 9a5.49 5.49 0 01-1.5 4.18z" fill="#FF5F00"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>Mastercard ending in 4242</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 2 }}>Expires 08 / 28</div>
                </div>
              </div>
              <button
                onClick={() => setShowCard(true)}
                style={{ padding: '7px 16px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Replace
              </button>
            </div>
          </div>

          {/* Billing history */}
          <div style={{ ...card, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Billing History</div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                <Download size={12} /> Export all
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Invoice', 'Description', 'Date', 'Amount', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((row, i) => (
                    <tr key={row.id} style={{ borderBottom: i < HISTORY.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                      <td style={{ padding: '11px 12px', color: '#6B7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{row.id}</td>
                      <td style={{ padding: '11px 12px', color: '#374151', fontWeight: 500 }}>{row.desc}</td>
                      <td style={{ padding: '11px 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ padding: '11px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>${row.amount.toFixed(2)}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 6 }}>{row.status}</span>
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                          <Download size={12} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — plan summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 16 }}>What's included</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Users, label: 'Unlimited clients & invoices' },
                { icon: TrendingUp, label: 'Full CRM + pipeline' },
                { icon: Zap, label: 'AI Business Assistant' },
                { icon: Shield, label: 'Tax center & expense tracking' },
                { icon: Check, label: 'Priority support' },
                { icon: Check, label: 'Founding member badge' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={11} color="#16A34A" />
                  </div>
                  <span style={{ fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Founding member rate</div>
            <div style={{ fontSize: 12, color: '#92400E', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
              Your $19/mo rate is locked in for life. If you ever cancel and resubscribe, the standard rate applies.
            </div>
          </div>

          <button style={{ padding: '11px 0', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Cancel subscription
          </button>
        </div>
      </div>

      {/* Update card modal */}
      {showCard && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowCard(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Update payment method</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 24 }}>Your card details are encrypted and stored securely.</div>
            {[
              { label: 'Cardholder name', placeholder: 'Jane Smith', type: 'text' },
              { label: 'Card number', placeholder: '1234 5678 9012 3456', type: 'text' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[{ label: 'Expiry', placeholder: 'MM / YY' }, { label: 'CVC', placeholder: '•••' }].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 6 }}>{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCard(false)} style={{ flex: 1, padding: '11px 0', background: '#F3F4F6', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
              <button onClick={() => setShowCard(false)} style={{ flex: 2, padding: '11px 0', background: '#16A34A', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save card</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
