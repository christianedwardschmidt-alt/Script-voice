'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: number
  title: string
  slug: string
  category: string
  status: string
  publish_date: string
  read_time: number
  featured: number
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
    fetch('/api/blog?status=all')
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [isAdmin])

  async function deletePost(id: number) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  async function toggleStatus(post: Post) {
    const status = post.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status } : p))
  }

  if (!isAdmin) return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 52px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Blog Posts</h1>
          <div style={{ fontSize: 14, color: '#9CA3AF' }}>{posts.length} total posts</div>
        </div>
        <button
          onClick={() => router.push('/admin/blog/new')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: 'var(--accent-brand)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Post
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No posts yet</div>
          <button onClick={() => router.push('/admin/blog/new')} style={{ color: 'var(--accent-brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Write your first post →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: post.status === 'published' ? 'rgba(var(--accent-brand-rgb),0.1)' : '#F3F4F6',
                    color: post.status === 'published' ? 'var(--accent-brand)' : '#9CA3AF',
                  }}>
                    {post.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  {post.featured === 1 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                      Featured
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.category}</span>
                  <span style={{ fontSize: 12, color: '#D1D5DB' }}>·</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{post.read_time} min</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>/{post.slug}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '6px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', color: '#374151', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                >
                  View
                </a>
                <button
                  onClick={() => toggleStatus(post)}
                  style={{ padding: '6px 12px', border: `1.5px solid ${post.status === 'published' ? '#FEF3C7' : '#D1FAE5'}`, borderRadius: 8, background: 'white', color: post.status === 'published' ? '#CA8A04' : 'var(--accent-brand)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                  style={{ padding: '6px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  style={{ padding: '6px 12px', border: '1.5px solid #FEE2E2', borderRadius: 8, background: 'white', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
