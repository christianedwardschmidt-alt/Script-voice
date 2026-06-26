'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Printer,
  Copy,
  X,
} from 'lucide-react'

type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft'

const statusColors: Record<InvoiceStatus, string> = {
  Paid: '#10b981',
  Pending: '#6366f1',
  Overdue: '#ef4444',
  Draft: '#64748b',
}

const invoices = [
  {
    id: 'INV-2024-089', client: 'Acme Corp', project: 'Brand Redesign Q4', amount: 4800,
    status: 'Paid' as InvoiceStatus, issued: 'Nov 15, 2024', due: 'Dec 15, 2024', paid: 'Dec 10, 2024',
    avatar: '👩🏻‍💼', avatarBg: '#6366f1',
  },
  {
    id: 'INV-2024-090', client: 'TechFlow Inc', project: 'API Integration', amount: 3200,
    status: 'Pending' as InvoiceStatus, issued: 'Dec 1, 2024', due: 'Jan 1, 2025', paid: null,
    avatar: '👨🏻‍💻', avatarBg: '#8b5cf6',
  },
  {
    id: 'INV-2024-088', client: 'DataSync', project: 'Dashboard Phase 2', amount: 8400,
    status: 'Overdue' as InvoiceStatus, issued: 'Oct 20, 2024', due: 'Nov 20, 2024', paid: null,
    avatar: '👨🏽‍💼', avatarBg: '#10b981',
  },
  {
    id: 'INV-2024-091', client: 'NovaBuild', project: 'Mobile App Discovery', amount: 2100,
    status: 'Draft' as InvoiceStatus, issued: 'Dec 20, 2024', due: 'Jan 20, 2025', paid: null,
    avatar: '👩🏻‍🎨', avatarBg: '#f97316',
  },
  {
    id: 'INV-2024-087', client: 'Bright Ideas', project: 'Content Strategy', amount: 1600,
    status: 'Paid' as InvoiceStatus, issued: 'Oct 10, 2024', due: 'Nov 10, 2024', paid: 'Nov 5, 2024',
    avatar: '👩🏿‍💼', avatarBg: '#ec4899',
  },
  {
    id: 'INV-2024-086', client: 'InnovateTech', project: 'E-commerce Build', amount: 6200,
    status: 'Paid' as InvoiceStatus, issued: 'Sep 15, 2024', due: 'Oct 15, 2024', paid: 'Oct 12, 2024',
    avatar: '👨🏽‍💻', avatarBg: '#06b6d4',
  },
]

const statusIcons: Record<InvoiceStatus, React.ElementType> = {
  Paid: CheckCircle,
  Pending: Clock,
  Overdue: AlertCircle,
  Draft: FileText,
}

const lineItems = [
  { description: 'UI Design — Homepage & Landing', quantity: 1, rate: 2400, total: 2400 },
  { description: 'Component Library (40 components)', quantity: 1, rate: 1800, total: 1800 },
  { description: 'Prototype & Interactions', quantity: 1, rate: 600, total: 600 },
]

const card: React.CSSProperties = {
  background: '#0e0e1c',
  border: '1px solid #1a1a30',
  borderRadius: 14,
  padding: 20,
}

export default function InvoicingPage() {
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [showNewInvoice, setShowNewInvoice] = useState(false)

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const pending = invoices.filter(i => i.status === 'Pending').reduce((a, c) => a + c.amount, 0)
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((a, c) => a + c.amount, 0)
  const outstanding = pending + overdue

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.client.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = selectedStatus === 'All' || inv.status === selectedStatus
    return matchSearch && matchStatus
  })

  const invoiceTotal = lineItems.reduce((a, c) => a + c.total, 0)

  return (
    <div style={{ padding: '28px 32px', background: '#07070f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Invoicing</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Create, send, and track professional invoices</p>
        </div>
        <button
          onClick={() => setShowNewInvoice(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}
        >
          <Plus size={14} />
          New Invoice
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Paid', value: `$${totalRevenue.toLocaleString()}`, icon: CheckCircle, color: '#10b981', sub: `${invoices.filter(i => i.status === 'Paid').length} invoices` },
          { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: Clock, color: '#6366f1', sub: 'Pending + Overdue' },
          { label: 'Overdue', value: `$${overdue.toLocaleString()}`, icon: AlertCircle, color: '#ef4444', sub: `${invoices.filter(i => i.status === 'Overdue').length} invoices` },
          { label: 'Total Invoiced', value: `$${invoices.reduce((a, c) => a + c.amount, 0).toLocaleString()}`, icon: TrendingUp, color: '#8b5cf6', sub: '2024 total' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card-hover" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: selectedStatus === s ? 600 : 400,
              background: selectedStatus === s ? (s === 'All' ? '#6366f1' : `${statusColors[s as InvoiceStatus] || '#6366f1'}`) : '#0e0e1c',
              color: selectedStatus === s ? '#fff' : '#64748b',
              border: selectedStatus === s ? 'none' : '1px solid #1a1a30',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s}
            {s !== 'All' && (
              <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 10 }}>
                {invoices.filter(i => i.status === s).length}
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              style={{ padding: '7px 10px 7px 30px', background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 8, color: '#f1f5f9', fontSize: 12, outline: 'none', width: 200 }}
            />
          </div>
          <button style={{ padding: '7px 12px', background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 8, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <Filter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a30' }}>
              {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Issued', 'Due', 'Action'].map((h) => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', padding: '14px 16px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const StatusIcon = statusIcons[inv.status]
              const color = statusColors[inv.status]
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid #111120', transition: 'background 0.1s' }} className="card-hover">
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{inv.id}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: inv.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                        {inv.avatar}
                      </div>
                      <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{inv.client}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b' }}>{inv.project}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: inv.status === 'Overdue' ? '#ef4444' : '#10b981' }}>
                    ${inv.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <StatusIcon size={12} color={color} />
                      <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: '2px 9px', borderRadius: 20 }}>
                        {inv.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b' }}>{inv.issued}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: inv.status === 'Overdue' ? '#ef4444' : '#64748b', fontWeight: inv.status === 'Overdue' ? 600 : 400 }}>
                    {inv.due}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="View" style={{ width: 28, height: 28, borderRadius: 6, background: '#141428', border: '1px solid #252545', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                        <Eye size={12} />
                      </button>
                      {inv.status !== 'Paid' && (
                        <button title="Send" style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f118', border: '1px solid #6366f130', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#818cf8' }}>
                          <Send size={12} />
                        </button>
                      )}
                      <button title="Download" style={{ width: 28, height: 28, borderRadius: 6, background: '#141428', border: '1px solid #252545', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                        <Download size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0e0e1c', border: '1px solid #252545', borderRadius: 16, width: '90%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #1a1a30' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>New Invoice</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>INV-2024-092</div>
              </div>
              <button onClick={() => setShowNewInvoice(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* From/To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {[
                  { label: 'From', name: 'Alex Freeman', email: 'alex@freelance.io', address: 'San Francisco, CA' },
                  { label: 'Bill To', name: '', email: '', address: '' },
                ].map((party) => (
                  <div key={party.label}>
                    <div style={{ fontSize: 11, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 600 }}>{party.label}</div>
                    {party.label === 'From' ? (
                      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{party.name}</div>
                        <div>{party.email}</div>
                        <div>{party.address}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['Client Name', 'Email', 'Company'].map((placeholder) => (
                          <input key={placeholder} placeholder={placeholder} style={{ padding: '8px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, color: '#f1f5f9', fontSize: 12, outline: 'none', width: '100%' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {['Issue Date', 'Due Date', 'Project'].map((label) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{label}</div>
                    <input placeholder={label === 'Project' ? 'Project name...' : 'Dec 20, 2024'} style={{ padding: '8px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, color: '#f1f5f9', fontSize: 12, outline: 'none', width: '100%' }} />
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {['Description', 'Qty', 'Rate', 'Total'].map((h) => (
                    <div key={h} style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
                  ))}
                </div>
                {lineItems.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div style={{ padding: '9px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, fontSize: 12, color: '#94a3b8' }}>{item.description}</div>
                    <div style={{ padding: '9px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{item.quantity}</div>
                    <div style={{ padding: '9px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>${item.rate.toLocaleString()}</div>
                    <div style={{ padding: '9px 10px', background: '#141428', border: '1px solid #252545', borderRadius: 7, fontSize: 12, color: '#10b981', fontWeight: 600, textAlign: 'right' }}>${item.total.toLocaleString()}</div>
                  </div>
                ))}
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 7, background: '#141428', border: '1px dashed #252545', color: '#6366f1', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
                  <Plus size={12} />
                  Add Line Item
                </button>
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #1a1a30', paddingTop: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 260, marginLeft: 'auto' }}>
                  {[
                    { label: 'Subtotal', value: `$${invoiceTotal.toLocaleString()}` },
                    { label: 'Tax (0%)', value: '$0' },
                    { label: 'Total', value: `$${invoiceTotal.toLocaleString()}`, bold: true, color: '#6366f1' },
                  ].map(({ label, value, bold, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: bold ? '#f1f5f9' : '#64748b', fontWeight: bold ? 700 : 400 }}>{label}</span>
                      <span style={{ fontSize: 13, color: color || (bold ? '#f1f5f9' : '#94a3b8'), fontWeight: bold ? 700 : 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                {[
                  { label: 'Save Draft', icon: Copy, style: { background: '#141428', border: '1px solid #252545', color: '#94a3b8' } },
                  { label: 'Print PDF', icon: Printer, style: { background: '#141428', border: '1px solid #252545', color: '#94a3b8' } },
                  { label: 'Send Invoice', icon: Send, style: { background: '#6366f1', border: 'none', color: '#fff', boxShadow: '0 0 12px rgba(99,102,241,0.3)' } },
                ].map(({ label, icon: Icon, style: btnStyle }) => (
                  <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', ...btnStyle }}>
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
