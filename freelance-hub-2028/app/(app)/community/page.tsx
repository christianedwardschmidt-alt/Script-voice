'use client'

import { useEffect, useState } from 'react'
import {
  Bookmark, Heart, MessageCircle, Share2, MoreHorizontal,
  TrendingUp, Users, Award, Image, Smile, Link2, Send,
  Repeat2, ThumbsUp, Eye,
} from 'lucide-react'

const trending = [
  { tag: '#FreelanceLife', posts: '12.4k posts' },
  { tag: '#WebDesign2026', posts: '8.9k posts' },
  { tag: '#AITools', posts: '15.2k posts' },
  { tag: '#RemoteWork', posts: '9.7k posts' },
  { tag: '#UXDesign', posts: '6.3k posts' },
]

const suggested = [
  { name: 'Alex Thompson', handle: '@alex_design', role: 'Brand Designer', mutual: 12, avatar: '👨🏼‍🎨', color: '#16a34a', followers: '4.2k' },
  { name: 'Jessica Wu', handle: '@jess_markets', role: 'Marketing Expert', mutual: 8, avatar: '👩🏻‍💼', color: '#ec4899', followers: '8.1k' },
  { name: 'David Park', handle: '@dpark_video', role: 'Video Creator', mutual: 5, avatar: '👨🏻‍💻', color: '#f59e0b', followers: '11.5k' },
]

interface Post {
  id: number
  author: string
  handle: string
  role: string
  avatar: string
  color: string
  time: string
  trending: boolean
  content: string
  image: { type: string; label: string; emoji: string; grad: string } | null
  likes: number
  comments: number
  shares: number
  views: number
  liked: boolean
  saved: boolean
  reposted: boolean
}

const stories = [
  { name: 'You', avatar: '⚡', color: '#16a34a', isOwn: true },
  { name: 'Sarah J.', avatar: '👩🏻‍🎨', color: '#16a34a', isOwn: false },
  { name: 'Marcus', avatar: '👨🏾‍💻', color: '#10b981', isOwn: false },
  { name: 'Priya', avatar: '👩🏽‍💻', color: '#f59e0b', isOwn: false },
  { name: 'David', avatar: '👨🏻‍💻', color: '#ec4899', isOwn: false },
]

const tabs = ['Feed', 'Trending', 'Saved']

export default function CommunityPage() {
  const [postData, setPostData] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Feed')
  const [newPost, setNewPost] = useState('')

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(rows => { setPostData(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  const toggleLike = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const liked = !post.liked
    setPostData(p => p.map(post => post.id === id
      ? { ...post, liked, likes: liked ? post.likes + 1 : post.likes - 1 }
      : post
    ))
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liked }),
    })
  }
  const toggleSave = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const saved = !post.saved
    setPostData(p => p.map(post => post.id === id ? { ...post, saved } : post))
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved }),
    })
  }
  const toggleRepost = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const reposted = !post.reposted
    setPostData(p => p.map(post => post.id === id
      ? { ...post, reposted, shares: reposted ? post.shares + 1 : post.shares - 1 }
      : post
    ))
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reposted }),
    })
  }

  const createPost = async () => {
    if (!newPost.trim()) return
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost }),
    })
    const created = await res.json()
    setPostData(prev => [created, ...prev])
    setNewPost('')
  }

  const displayed = activeTab === 'Saved'
    ? postData.filter(p => p.saved)
    : activeTab === 'Trending'
    ? [...postData].sort((a, b) => b.likes - a.likes)
    : postData

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Community</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Connect, share, and grow with fellow freelancers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 20 }}>

        {/* ── Left panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#1c1917' }}>
              <TrendingUp size={15} color="#16a34a" /> Trending Topics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trending.map((t, i) => (
                <div key={t.tag} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#78716c' }}>#{i + 1} freelance</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{t.tag}</div>
                    <div style={{ fontSize: 11, color: '#78716c' }}>{t.posts}</div>
                  </div>
                  <MoreHorizontal size={14} color="#d1d5db" style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#1c1917' }}>
              <Users size={15} color="#16a34a" /> Who to Follow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggested.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.color + '20', border: `2px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {s.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#16a34a' }}>{s.handle}</div>
                    <div style={{ fontSize: 11, color: '#78716c' }}>{s.followers} followers</div>
                  </div>
                  <button style={{ padding: '5px 10px', border: '1px solid #16a34a', borderRadius: 20, background: 'var(--card)', fontSize: 11, fontWeight: 700, color: '#16a34a', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feed ── */}
        <div>
          {/* Stories row */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
              {stories.map(s => (
                <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: s.isOwn ? '#f3f4f6' : 'none', border: s.isOwn ? '2px dashed #d1d5db' : `2px solid ${s.color}`, padding: s.isOwn ? 0 : 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: s.isOwn ? 48 : 44, height: s.isOwn ? 48 : 44, borderRadius: '50%', background: s.isOwn ? '#f9fafb' : s.color + '20', border: s.isOwn ? 'none' : '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s.isOwn ? 20 : 18 }}>
                      {s.isOwn ? <span style={{ fontSize: 18, color: '#16a34a' }}>+</span> : s.avatar}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: s.isOwn ? '#6b7280' : '#111827', fontWeight: s.isOwn ? 400 : 500 }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px', border: 'none', background: 'none', fontSize: 14,
                  fontWeight: activeTab === tab ? 700 : 400,
                  color: activeTab === tab ? '#111827' : '#9ca3af',
                  borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
                  cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Compose box */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="What's on your mind?"
                  style={{ width: '100%', background: 'none', border: 'none', fontSize: 15, color: '#1c1917', resize: 'none', outline: 'none', minHeight: 56, fontFamily: 'inherit', lineHeight: 1.5 }}
                />
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[{ icon: Image, color: '#16a34a' }, { icon: Smile, color: '#f59e0b' }, { icon: Link2, color: '#10b981' }].map(({ icon: Icon, color }, i) => (
                    <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} />
                    </button>
                  ))}
                  <button
                    className="btn-primary"
                    style={{ marginLeft: 'auto', padding: '7px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={createPost}
                  >
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading posts...</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!loading && displayed.map(post => (
              <div key={post.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {post.trending && (
                  <div style={{ padding: '6px 18px', background: '#fef9c3', borderBottom: '1px solid #fde68a', fontSize: 12, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 5 }}>
                    🔥 Trending in #FreelanceLife
                  </div>
                )}
                <div style={{ padding: 18 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: post.color + '18', border: `2px solid ${post.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {post.avatar}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#1c1917' }}>{post.author}</span>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: post.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#78716c' }}>{post.handle} · {post.role} · {post.time === 'now' ? 'just now' : `${post.time} ago`}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => toggleSave(post.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.saved ? '#f59e0b' : '#d1d5db', padding: 4, borderRadius: 6 }}
                      >
                        <Bookmark size={17} fill={post.saved ? '#f59e0b' : 'none'} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 4, borderRadius: 6 }}>
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: 14, color: '#1c1917', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: post.image ? 14 : 0 }}>
                    {post.content}
                  </p>

                  {/* Image */}
                  {post.image && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 0 }}>
                      <div style={{ height: 220, background: post.image.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}>
                        <div style={{ fontSize: 52 }}>{post.image.emoji}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', background: 'rgba(255,255,255,0.85)', padding: '4px 14px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                          {post.image.label}
                        </div>
                        {post.image.type === 'design' && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#78716c', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Eye size={12} /> {fmtNum(post.views)} views
                    </span>
                    <span style={{ fontSize: 12, color: '#78716c' }}>{post.comments} comments</span>
                    <span style={{ fontSize: 12, color: '#78716c' }}>{post.shares} reposts</span>
                  </div>

                  {/* Action bar */}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10, display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: post.liked ? '#fce7f3' : 'none', border: 'none', cursor: 'pointer', color: post.liked ? '#db2777' : '#9ca3af', fontSize: 13, fontWeight: post.liked ? 700 : 400, padding: '7px 14px', borderRadius: 8, transition: 'all 0.15s' }}
                    >
                      <Heart size={15} fill={post.liked ? '#db2777' : 'none'} strokeWidth={post.liked ? 0 : 2} />
                      {fmtNum(post.likes)}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', fontSize: 13, padding: '7px 14px', borderRadius: 8 }}>
                      <MessageCircle size={15} /> {post.comments}
                    </button>
                    <button
                      onClick={() => toggleRepost(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: post.reposted ? '#d1fae5' : 'none', border: 'none', cursor: 'pointer', color: post.reposted ? '#059669' : '#9ca3af', fontSize: 13, padding: '7px 14px', borderRadius: 8, transition: 'all 0.15s' }}
                    >
                      <Repeat2 size={15} /> {post.shares}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', fontSize: 13, padding: '7px 14px', borderRadius: 8 }}>
                      <Share2 size={15} /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top Contributor */}
          <div style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', borderRadius: 16, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Top Contributor</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>This month</div>
              </div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 2 }}>247</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>Community Points</div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>42</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Posts</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>1.2k</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Likes</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>89</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Saves</div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1c1917', marginBottom: 14 }}>Upcoming Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Freelance Meetup NYC', date: 'Tomorrow, 6:00 PM', type: 'In-person', color: '#16a34a', bg: '#dcfce7' },
                { name: 'AI Tools Workshop', date: 'Jan 15, 2:00 PM', type: 'Virtual', color: '#10b981', bg: '#d1fae5' },
                { name: 'Design Sprint', date: 'Jan 18, 10:00 AM', type: 'Virtual', color: '#f59e0b', bg: '#fef9c3' },
              ].map((event, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 3 }}>{event.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: event.color, background: event.bg, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginLeft: 8 }}>{event.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c' }}>{event.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtag suggest */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1c1917', marginBottom: 12 }}>Your Top Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#Figma', '#NextJS', '#UIDesign', '#Freelance', '#Remote', '#SaaS', '#Branding'].map(tag => (
                <span key={tag} className="badge badge-inprogress" style={{ cursor: 'pointer' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
