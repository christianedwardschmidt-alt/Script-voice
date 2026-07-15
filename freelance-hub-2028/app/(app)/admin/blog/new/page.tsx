'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Opinion', 'Practical', 'Personal', 'Industry']

export default function NewBlogPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'Practical',
    excerpt: '',
    content: '',
    featured: false,
    status: 'draft',
    publish_date: new Date().toISOString().split('T')[0],
    meta_title: '',
    meta_description: '',
    read_time: 5,
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

  function set(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function save(status: string) {
    setSaving(true)
    const payload = { ...form, status, slug: form.slug || autoSlug(form.title), meta_title: form.meta_title || form.title, meta_description: form.meta_description || form.excerpt }
    const r = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (r.ok) {
      const { id } = await r.json()
      router.push(`/admin/blog/${id}/edit`)
    } else {
      alert('Failed to save post.')
      setSaving(false)
    }
  }

  if (!isAdmin) return null

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
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>New Post</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={() => save('draft')} disabled={saving || !form.title} style={{ padding: '9px 20px', border: '1.5px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.title ? 0.6 : 1 }}>
            Save Draft
          </button>
          <button onClick={() => save('published')} disabled={saving || !form.title} style={{ padding: '9px 20px', border: 'none', borderRadius: 9, background: 'var(--accent-brand)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.title ? 0.6 : 1 }}>
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      <BlogEditor form={form} set={set} autoSlug={autoSlug} />
    </div>
  )
}

function BlogEditor({ form, set, autoSlug }: {
  form: Record<string, unknown>
  set: (k: string, v: unknown) => void
  autoSlug: (t: string) => string
}) {
  const CATEGORIES = ['Opinion', 'Practical', 'Personal', 'Industry']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <label style={labelStyle}>Title</label>
        <input
          value={form.title as string}
          onChange={e => {
            set('title', e.target.value)
            if (!form.slug) set('slug', autoSlug(e.target.value))
          }}
          placeholder="Post title…"
          style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }}
        />
      </div>

      {/* Slug */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Slug</label>
          <input value={form.slug as string} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select value={form.category as string} onChange={e => set('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label style={labelStyle}>Excerpt</label>
        <textarea value={form.excerpt as string} onChange={e => set('excerpt', e.target.value)} rows={3} placeholder="Short summary shown in listings…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {/* Content */}
      <div>
        <label style={labelStyle}>Content <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(HTML supported)</span></label>
        <textarea
          value={form.content as string}
          onChange={e => set('content', e.target.value)}
          rows={24}
          placeholder="Write your post here. Use <p>, <h2>, <h3>, <blockquote>, <ul>, <li> etc."
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.65, resize: 'vertical' }}
        />
      </div>

      {/* Settings row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Publish Date</label>
          <input type="date" value={form.publish_date as string} onChange={e => set('publish_date', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Read Time (min)</label>
          <input type="number" value={form.read_time as number} onChange={e => set('read_time', parseInt(e.target.value))} min={1} max={60} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Featured?</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.featured as boolean} onChange={e => set('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-brand)' }} />
            <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Show as featured post</span>
          </label>
        </div>
      </div>

      {/* SEO */}
      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: -4 }}>SEO (optional)</div>
        <div>
          <label style={labelStyle}>Meta Title</label>
          <input value={form.meta_title as string} onChange={e => set('meta_title', e.target.value)} placeholder="Defaults to post title" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Meta Description</label>
          <input value={form.meta_description as string} onChange={e => set('meta_description', e.target.value)} placeholder="Defaults to excerpt" style={inputStyle} />
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.03em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 14, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export { BlogEditor, labelStyle, inputStyle }
