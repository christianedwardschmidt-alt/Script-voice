'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FormState {
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  featured: boolean
  status: string
  publish_date: string
  meta_title: string
  meta_description: string
  read_time: number
}

const CATEGORIES = ['Opinion', 'Practical', 'Personal', 'Industry']

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.03em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<FormState>({
    title: '', slug: '', category: 'Practical', excerpt: '', content: '',
    featured: false, status: 'draft',
    publish_date: new Date().toISOString().split('T')[0],
    meta_title: '', meta_description: '', read_time: 5,
  })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(profile => {
        if (profile?.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'christianedwardschmidt@gmail.com')) {
          setIsAdmin(true)
        } else {
          router.replace('/dashboard')
        }
      })
      .catch(() => router.replace('/dashboard'))
  }, [router])

  useEffect(() => {
    if (!isAdmin) return
    fetch(`/api/blog/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title: data.title ?? '',
          slug: data.slug ?? '',
          category: data.category ?? 'Practical',
          excerpt: data.excerpt ?? '',
          content: data.content ?? '',
          featured: !!data.featured,
          status: data.status ?? 'draft',
          publish_date: data.publish_date ? data.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
          meta_title: data.meta_title ?? '',
          meta_description: data.meta_description ?? '',
          read_time: data.read_time ?? 5,
        })
        setLoading(false)
      })
  }, [isAdmin, id])

  function setField(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function savePost(status?: string) {
    setSaving(true)
    const payload = { ...form, status: status ?? form.status, featured: form.featured ? 1 : 0 }
    const r = await fetch(`/api/blog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (r.ok) {
      setSaved(true)
      if (status) setForm(f => ({ ...f, status }))
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Failed to save.')
    }
    setSaving(false)
  }

  if (!isAdmin || loading) return null

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => router.push('/admin/blog')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14, fontWeight: 600, padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Blog Admin
        </button>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Edit Post</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Saved!</span>}
          <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 16px', border: '1.5px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            View
          </a>
          {form.status === 'published' ? (
            <button onClick={() => savePost('draft')} disabled={saving} style={{ padding: '9px 18px', border: '1.5px solid #FEF3C7', borderRadius: 9, background: 'white', color: '#CA8A04', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              Unpublish
            </button>
          ) : (
            <button onClick={() => savePost('published')} disabled={saving} style={{ padding: '9px 18px', border: 'none', borderRadius: 9, background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              Publish
            </button>
          )}
          <button onClick={() => savePost()} disabled={saving} style={{ padding: '9px 18px', border: '1.5px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input value={form.title} onChange={e => setField('title', e.target.value)} style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Slug</label>
            <input value={form.slug} onChange={e => setField('slug', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={e => setField('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div>
          <label style={labelStyle}>Content <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(HTML supported)</span></label>
          <textarea value={form.content} onChange={e => setField('content', e.target.value)} rows={24} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.65, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Publish Date</label>
            <input type="date" value={form.publish_date} onChange={e => setField('publish_date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Read Time (min)</label>
            <input type="number" value={form.read_time} onChange={e => setField('read_time', parseInt(e.target.value))} min={1} max={60} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Featured?</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.featured} onChange={e => setField('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#16A34A' }} />
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Show as featured</span>
            </label>
          </div>
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: -4 }}>SEO</div>
          <div>
            <label style={labelStyle}>Meta Title</label>
            <input value={form.meta_title} onChange={e => setField('meta_title', e.target.value)} placeholder="Defaults to post title" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Meta Description</label>
            <input value={form.meta_description} onChange={e => setField('meta_description', e.target.value)} placeholder="Defaults to excerpt" style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  )
}
