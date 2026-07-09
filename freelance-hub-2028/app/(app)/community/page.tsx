'use client'

import { useEffect, useState } from 'react'
import {
  Bookmark, Heart, MessageCircle, Share2, MoreHorizontal,
  TrendingUp, Users, Award, Image, Smile, Link2, Send,
  Repeat2, Eye, Plus, Calendar,
} from 'lucide-react'

const trendingTopics = [
  { tag: '#FreelanceLife', posts: '12.4k', rank: 1 },
  { tag: '#WebDesign2026', posts: '8.9k',  rank: 2 },
  { tag: '#AITools',       posts: '15.2k', rank: 3 },
  { tag: '#RemoteWork',    posts: '9.7k',  rank: 4 },
  { tag: '#UXDesign',      posts: '6.3k',  rank: 5 },
]

const suggested = [
  { name: 'Alex Thompson', handle: '@alex_design',   role: 'Brand Designer',   mutual: 12, avatar: 'AT', color: '#16A34A', followers: '4.2k' },
  { name: 'Jessica Wu',    handle: '@jess_markets',  role: 'Marketing Expert', mutual: 8,  avatar: 'JW', color: '#EC4899', followers: '8.1k' },
  { name: 'David Park',    handle: '@dpark_video',   role: 'Video Creator',    mutual: 5,  avatar: 'DP', color: '#F59E0B', followers: '11.5k' },
]

const stories = [
  { name: 'You',    avatar: 'Y',  color: '#16A34A', isOwn: true },
  { name: 'Sarah',  avatar: 'SJ', color: '#16A34A', isOwn: false },
  { name: 'Marcus', avatar: 'M',  color: '#10B981', isOwn: false },
  { name: 'Priya',  avatar: 'P',  color: '#F59E0B', isOwn: false },
  { name: 'David',  avatar: 'D',  color: '#EC4899', isOwn: false },
]

interface Post {
  id: number; author: string; handle: string; role: string
  avatar: string; color: string; time: string; trending: boolean
  content: string; image: { type: string; label: string; emoji: string; grad: string } | null
  likes: number; comments: number; shares: number; views: number
  liked: boolean; saved: boolean; reposted: boolean
}

const tabs = ['Feed', 'Trending', 'Saved']

function fmtNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }

export default function CommunityPage() {
  const [postData, setPostData] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Feed')
  const [newPost, setNewPost] = useState('')

  useEffect(() => {
    fetch('/api/posts').then(r => r.json())
      .then(rows => { setPostData(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  const toggleLike = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const liked = !post.liked
    setPostData(p => p.map(post => post.id === id
      ? { ...post, liked, likes: liked ? post.likes + 1 : post.likes - 1 } : post))
    await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liked }) })
  }

  const toggleSave = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const saved = !post.saved
    setPostData(p => p.map(post => post.id === id ? { ...post, saved } : post))
    await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ saved }) })
  }

  const toggleRepost = async (id: number) => {
    const post = postData.find(p => p.id === id)
    if (!post) return
    const reposted = !post.reposted
    setPostData(p => p.map(post => post.id === id
      ? { ...post, reposted, shares: reposted ? post.shares + 1 : post.shares - 1 } : post))
    await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reposted }) })
  }

  const createPost = async () => {
    if (!newPost.trim()) return
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="page-pad" style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Community</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>Connect, share, and grow with fellow freelancers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 20 }} className="community-grid">

        {/* ── Left sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="community-side">

          {/* Trending */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
              <TrendingUp size={14} color="#16A34A" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Trending</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {trendingTopics.map((t, i) => (
                <div key={t.tag} style={{ cursor: 'pointer', padding: '9px 0', borderBottom: i < trendingTopics.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 2 }}>#{t.rank} · Freelance</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'var(--font-body)' }}>{t.tag}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 1 }}>{t.posts} posts</div>
                </div>
              ))}
            </div>
          </div>

          {/* Who to follow */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
              <Users size={14} color="#16A34A" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Who to Follow</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggested.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, border: `1.5px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.color, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                    {s.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 1 }}>{s.followers} followers</div>
                    <button style={{ marginTop: 6, padding: '3px 10px', border: `1px solid #16A34A`, borderRadius: 20, background: 'transparent', fontSize: 10, fontWeight: 700, color: '#16A34A', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Follow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main feed ── */}
        <div>
          {/* Stories row */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
              {stories.map(s => (
                <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    padding: 2,
                    background: s.isOwn ? 'none' : `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
                    border: s.isOwn ? '2px dashed #E5E7EB' : 'none',
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: s.isOwn ? '#F9FAFB' : `${s.color}15`, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: s.isOwn ? '#16A34A' : s.color, fontFamily: 'var(--font-display)' }}>
                      {s.isOwn ? <Plus size={16} strokeWidth={2.5} /> : s.avatar}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: s.isOwn ? '#9CA3AF' : '#374151', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', marginBottom: 14, background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', boxShadow: 'var(--shadow-sm)', padding: '0 4px' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '13px 18px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? '#111827' : '#9CA3AF',
                borderBottom: activeTab === tab ? '2px solid #16A34A' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Compose */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #14532D, #16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                Y
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={2}
                  style={{ width: '100%', background: 'none', border: 'none', fontSize: 14, color: '#111827', resize: 'none', outline: 'none', minHeight: 52, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
                />
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[{ Icon: Image, color: '#16A34A' }, { Icon: Smile, color: '#F59E0B' }, { Icon: Link2, color: '#10B981' }].map(({ Icon, color }, i) => (
                    <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px 6px', borderRadius: 7, display: 'flex', alignItems: 'center' }}>
                      <Icon size={16} />
                    </button>
                  ))}
                  <button
                    onClick={createPost}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {loading && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>
              Loading posts…
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!loading && displayed.map(post => (
              <div key={post.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                {post.trending && (
                  <div style={{ padding: '6px 20px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)' }}>
                    <TrendingUp size={11} /> Trending in #FreelanceLife
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  {/* Author row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${post.color}15`, border: `1.5px solid ${post.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: post.color, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-body)' }}>{post.author}</span>
                          <span style={{ width: 15, height: 15, borderRadius: '50%', background: post.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                          {post.handle} · {post.role} · {post.time === 'now' ? 'just now' : `${post.time} ago`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        onClick={() => toggleSave(post.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.saved ? '#F59E0B' : '#D1D5DB', padding: 5, borderRadius: 7 }}
                      >
                        <Bookmark size={16} fill={post.saved ? '#F59E0B' : 'none'} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 5, borderRadius: 7 }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: post.image ? 14 : 0, fontFamily: 'var(--font-body)' }}>
                    {post.content}
                  </p>

                  {/* Image card */}
                  {post.image && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                      <div style={{ height: 200, background: post.image.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}>
                        <div style={{ fontSize: 48, lineHeight: 1 }}>{post.image.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', background: 'rgba(255,255,255,0.9)', padding: '4px 14px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                          {post.image.label}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-body)' }}>
                      <Eye size={11} /> {fmtNum(post.views)} views
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{post.comments} comments</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{post.shares} reposts</span>
                  </div>

                  {/* Action bar */}
                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', background: post.liked ? '#FDE7F0' : 'none', border: 'none', cursor: 'pointer', color: post.liked ? '#DB2777' : '#9CA3AF', fontSize: 13, fontWeight: post.liked ? 700 : 400, padding: '7px 10px', borderRadius: 9, transition: 'all 0.12s', fontFamily: 'var(--font-body)' }}
                    >
                      <Heart size={15} fill={post.liked ? '#DB2777' : 'none'} strokeWidth={post.liked ? 0 : 2} />
                      {fmtNum(post.likes)}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, padding: '7px 10px', borderRadius: 9, fontFamily: 'var(--font-body)' }}>
                      <MessageCircle size={15} /> {post.comments}
                    </button>
                    <button
                      onClick={() => toggleRepost(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', background: post.reposted ? '#D1FAE5' : 'none', border: 'none', cursor: 'pointer', color: post.reposted ? '#059669' : '#9CA3AF', fontSize: 13, padding: '7px 10px', borderRadius: 9, transition: 'all 0.12s', fontFamily: 'var(--font-body)' }}
                    >
                      <Repeat2 size={15} /> {post.shares}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, padding: '7px 10px', borderRadius: 9, fontFamily: 'var(--font-body)' }}>
                      <Share2 size={15} /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && displayed.length === 0 && (
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                  {activeTab === 'Saved' ? 'No saved posts yet.' : 'No posts yet.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="community-side">

          {/* Top Contributor */}
          <div style={{ background: 'linear-gradient(145deg, #14532D 0%, #166534 50%, #15803D 100%)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: '0 4px 12px rgba(20,83,45,0.25), 0 12px 32px rgba(22,163,74,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#fff' }}>Top Contributor</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>This month</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>247</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 18, fontFamily: 'var(--font-body)' }}>Community Points</div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 0 }}>
              {[{ val: '42', label: 'Posts' }, { val: '1.2k', label: 'Likes' }, { val: '89', label: 'Saves' }].map((item, i, arr) => (
                <>
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{item.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{item.label}</div>
                  </div>
                  {i < arr.length - 1 && <div key={`div${i}`} style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.18)', margin: '0 auto' }} />}
                </>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
              <Calendar size={14} color="#16A34A" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Upcoming Events</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { name: 'Freelance Meetup NYC',  date: 'Tomorrow, 6:00 PM', type: 'In-person', color: '#16A34A' },
                { name: 'AI Tools Workshop',     date: 'Jul 15, 2:00 PM',   type: 'Virtual',   color: '#10B981' },
                { name: 'Design Sprint',         date: 'Jul 18, 10:00 AM',  type: 'Virtual',   color: '#F59E0B' },
              ].map((event, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? 12 : 0, paddingTop: i > 0 ? 12 : 0, borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3, fontFamily: 'var(--font-body)' }}>{event.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: event.color, background: `${event.color}12`, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginLeft: 8, fontFamily: 'var(--font-body)' }}>{event.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{event.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Top Tags */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 14, fontFamily: 'var(--font-body)' }}>Your Top Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#Figma', '#NextJS', '#UIDesign', '#Freelance', '#Remote', '#SaaS', '#Branding'].map(tag => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', background: '#16A34A12', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
