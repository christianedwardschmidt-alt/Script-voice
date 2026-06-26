'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, AlertCircle, Calculator, FileText, CheckCircle, TrendingDown, Plus, Upload } from 'lucide-react'

const quarterlyData = [
  { quarter: 'Q1', income: 24500, deductions: 6800, taxOwed: 4370 },
  { quarter: 'Q2', income: 31200, deductions: 8100, taxOwed: 5680 },
  { quarter: 'Q3', income: 27800, deductions: 7200, taxOwed: 4690 },
  { quarter: 'Q4', income: 38600, deductions: 9400, taxOwed: 7290 },
]

const deductions = [
  { category: 'Home Office', amount: 3600, icon: '🏠' },
  { category: 'Software & Tools', amount: 2840, icon: '💻' },
  { category: 'Education', amount: 1200, icon: '📚' },
  { category: 'Equipment', amount: 4100, icon: '🖥' },
  { category: 'Internet & Phone', amount: 960, icon: '📡' },
  { category: 'Health Insurance', amount: 5400, icon: '🏥' },
]

const docs = [
  { name: '1099-NEC (Tech Trophey)', status: 'Received', date: 'Jan 5' },
  { name: '1099-NEC (Hencewood)', status: 'Received', date: 'Jan 8' },
  { name: 'Schedule C Draft', status: 'In Progress', date: 'Jan 12' },
  { name: '2023 Tax Return', status: 'Filed', date: 'Apr 12' },
]

const docStatus: Record<string, string> = { Received: 'badge-purple', 'In Progress': 'badge-medium', Filed: 'badge-completed' }

export default function TaxPage() {
  const totalIncome = quarterlyData.reduce((a, c) => a + c.income, 0)
  const totalDeductions = deductions.reduce((a, c) => a + c.amount, 0)
  const totalTax = quarterlyData.reduce((a, c) => a + c.taxOwed, 0)

  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Tax Report</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>Maximize deductions, minimize surprises</p>
        </div>
        <button className="btn-primary"><Download size={14} /> Export Summary</button>
      </div>

      {/* Alert */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 20 }}>
        <AlertCircle size={15} color="#ca8a04" />
        <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>Q4 Estimated Tax due January 15 — $7,290</span>
        <a href="#" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none', marginLeft: 'auto' }}>Pay Now →</a>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Gross Income', value: `$${totalIncome.toLocaleString()}`, icon: Calculator, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Deductions', value: `$${totalDeductions.toLocaleString()}`, icon: TrendingDown, color: '#10b981', bg: '#d1fae5' },
          { label: 'Tax Owed', value: `$${totalTax.toLocaleString()}`, icon: FileText, color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Effective Rate', value: `${((totalTax / totalIncome) * 100).toFixed(1)}%`, icon: CheckCircle, color: '#ec4899', bg: '#fce7f3' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>Quarterly Breakdown</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Income · Deductions · Tax owed</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="income" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="deductions" fill="#10b981" radius={[4, 4, 0, 0]} name="Deductions" />
              <Bar dataKey="taxOwed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tax Owed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deductions */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Deductions</div>
            <button className="btn-outline" style={{ padding: '5px 10px', fontSize: 12 }}><Plus size={11} /> Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deductions.map(d => (
              <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#374151' }}>{d.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>${d.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(d.amount / 5400) * 100}%`, background: '#10b981', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#d1fae5', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#064e3b', marginBottom: 2 }}>Est. Tax Savings</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>~${Math.round(totalDeductions * 0.32).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Tax Documents</div>
          <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}><Upload size={11} /> Upload</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 3 }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{doc.date}</div>
              </div>
              <span className={`badge ${docStatus[doc.status]}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
