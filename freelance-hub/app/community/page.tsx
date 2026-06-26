'use client'

import { useState } from 'react'
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
  { name: 'Alex Thompson', handle: '@alex_design', role: 'Brand Designer', mutual: 12, avatar: '👨🏼‍🎨', color: '#7c3aed', followers: '4.2k' },
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

const posts: Post[] = [
  {
    id: 1,
    author: 'Sarah Johnson',
    handle: '@sarahj_ux',
    role: 'Senior UI/UX Designer',
    avatar: '👩🏻‍🎨',
    color: '#7c3aed',
    time: '2h',
    trending: true,
    content: 'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off.\n\nHere\'s what worked for me:\n→ Niching down to SaaS dashboards only\n→ Cold outreach with a custom Loom video\n→ Packaging services at 3 clear price points\n\nThe journey is everything. Keep going. 💜',
    image: { type: 'design', label: 'Dashboard Redesign Preview', emoji: '🖥', grad: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 50%, #a78bfa 100%)' },
    likes: 142,
    comments: 38,
    shares: 21,
    views: 8400,
    liked: false,
    saved: false,
    reposted: false,
  },
  {
    id: 2,
    author: 'Marcus Williams',
    handle: '@marcusdev',
    role: 'Full Stack Developer',
    avatar: '👨🏾‍💻',
    color: '#10b981',
    time: '5h',
    trending: false,
    content: 'Hot take: The single best thing I did for my freelance career was raising my rates.\n\nWent from $85/hr → $150/hr and actually got MORE serious clients.\n\nPrice is a signal. Premium pricing filters out problem clients automatically. Don\'t under-price to win — it signals risk.',
    image: { type: 'chart', label: 'Revenue Growth 2025→2026', emoji: '📈', grad: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)' },
    likes: 287,
    comments: 64,
    shares: 89,
    views: 21300,
    liked: true,
    saved: false,
    reposted: false,
  },
  {
    id: 3,
    author: 'Priya Sharma',
    handle: '@priya_uxr',
    role: 'UX Researcher',
    avatar: '👩🏽‍💻',
    color: '#f59e0b',
    time: '1d',
    trending: false,
    content: 'Sharing my freelance contract template — took me 2 years and one bad client experience to get right.\n\nIncludes:\n✅ Scope of work clauses\n✅ Revision limits\n✅ Kill fee (25% if client cancels)\n✅ IP ownership on final payment\n\nDM me for the full version. No strings.',
    image: null,
    likes: 512,
    comments: 97,
    shares: 203,
    views: 34100,
    liked: false,
    saved: true,
    reposted: false,
  },
  {
    id: 4,
    author: 'Tom Blake',
    handle: '@tomblake_brand',
    role: 'Brand Strategist',
    avatar: '👨🏼‍💼',
    color: '#06b6d4',
    time: '2d',
    trending: false,
    content: 'My home office setup after 3 years of freelancing. The monitor arm was a game changer. 🖥\n\nTools I swear by:\n• Standing desk (health investment)\n• Good mic (clients notice)\n• Notion + LanceFlo for project tracking\n\nWhat\'s your must-have setup piece?',
    image: { type: 'photo', label: 'Home Office Setup', emoji: '🖥', grad: 'linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)' },
    likes: 94,
    comments: 41,
    shares: 7,
    views: 5200,
    liked: false,
    saved: false,
    reposted: true,
  },
]

const stories = [
  { name: 'You', avatar: '⚡', color: '#7c3aed', isOwn: true },
  { name: 'Sarah J.', avatar: '👩🏻‍🎨', color: '#7c3aed', isOwn: false },
  { name: 'Marcus', avatar: '👨🏾‍💻', color: '#10b981', isOwn: false },
  { name: 'Priya', avatar: '👩🏽‍💻', color: '#f59e0b', isOwn: false },
  { name: 'David', avatar: '👨🏻‍💻', color: '#ec4899', isOwn: false },
]

const tabs = ['Feed', 'Trending', 'Saved']

export default function CommunityPage() {
  const [postData, setPostData] = useState<Post[]>(posts)
  const [activeTab, setActiveTab] = useState('Feed')
  const [newPost, setNewPost] = useState('')

  const toggleLike = (id: number) => {
    setPostData(p => p.map(post => post.id === id
      ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
      : post
    ))
  }
  const toggleSave = (id: number) => {
    setPostData(p => p.map(post => post.id === id ? { ...post, saved: !post.saved } : post))
  }
  const toggleRepost = (id: number) => {
    setPostData(p => p.map(post => post.id === id
      ? { ...post, reposted: !post.reposted, shares: post.reposted ? post.shares - 1 : post.shares + 1 }
      : post
    ))
  }

  const displayed = activeTab === 'Saved'
    ? postData.filter(p => p.saved)
    : activeTab === 'Trending'
    ? [...postData].sort((a, b) => b.likes - a.likes)
    : postData

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Community</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>Connect, share, and grow with fellow freelancers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 20 }}>

        {/* ── Left panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#111827' }}>
              <TrendingUp size={15} color="#7c3aed" /> Trending Topics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trending.map((t, i) => (
                <div key={t.tag} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>#{i + 1} freelance</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>{t.tag}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.posts}</div>
                  </div>
                  <MoreHorizontal size={14} color="#d1d5db" style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#111827' }}>
              <Users size={15} color="#7c3aed" /> Who to Follow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggested.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.color + '20', border: `2px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {s.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#7c3aed' }}>{s.handle}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.followers} followers</div>
                  </div>
                  <button style={{ padding: '5px 10px', border: '1px solid #7c3aed', borderRadius: 20, background: '#fff', fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
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
                      {s.isOwn ? <span style={{ fontSize: 18, color: '#7c3aed' }}>+</span> : s.avatar}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: s.isOwn ? '#6b7280' : '#111827', fontWeight: s.isOwn ? 400 : 500 }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 14 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px', border: 'none', background: 'none', fontSize: 14,
                  fontWeight: activeTab === tab ? 700 : 400,
                  color: activeTab === tab ? '#111827' : '#9ca3af',
                  borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
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
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="What's on your mind?"
                  style={{ width: '100%', background: 'none', border: 'none', fontSize: 15, color: '#111827', resize: 'none', outline: 'none', minHeight: 56, fontFamily: 'inherit', lineHeight: 1.5 }}
                />
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[{ icon: Image, color: '#7c3aed' }, { icon: Smile, color: '#f59e0b' }, { icon: Link2, color: '#10b981' }].map(({ icon: Icon, color }, i) => (
                    <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} />
                    </button>
                  ))}
                  <button
                    className="btn-primary"
                    style={{ marginLeft: 'auto', padding: '7px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(post => (
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
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{post.author}</span>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: post.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{post.handle} · {post.role} · {post.time} ago</div>
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
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: post.image ? 14 : 0 }}>
                    {post.content}
                  </p>

                  {/* Image */}
                  {post.image && (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 0 }}>
                      <div style={{ height: 220, background: post.image.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}>
                        <div style={{ fontSize: 52 }}>{post.image.emoji}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', background: 'rgba(255,255,255,0.85)', padding: '4px 14px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
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
                    <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Eye size={12} /> {fmtNum(post.views)} views
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{post.comments} comments</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{post.shares} reposts</span>
                  </div>

                  {/* Action bar */}
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: post.liked ? '#fce7f3' : 'none', border: 'none', cursor: 'pointer', color: post.liked ? '#db2777' : '#9ca3af', fontSize: 13, fontWeight: post.liked ? 700 : 400, padding: '7px 14px', borderRadius: 8, transition: 'all 0.15s' }}
                    >
                      <Heart size={15} fill={post.liked ? '#db2777' : 'none'} strokeWidth={post.liked ? 0 : 2} />
                      {fmtNum(post.likes)}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: '7px 14px', borderRadius: 8 }}>
                      <MessageCircle size={15} /> {post.comments}
                    </button>
                    <button
                      onClick={() => toggleRepost(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: post.reposted ? '#d1fae5' : 'none', border: 'none', cursor: 'pointer', color: post.reposted ? '#059669' : '#9ca3af', fontSize: 13, padding: '7px 14px', borderRadius: 8, transition: 'all 0.15s' }}
                    >
                      <Repeat2 size={15} /> {post.shares}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: '7px 14px', borderRadius: 8 }}>
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
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67f8)', borderRadius: 16, padding: 20, color: '#fff' }}>
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
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 14 }}>Upcoming Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Freelance Meetup NYC', date: 'Tomorrow, 6:00 PM', type: 'In-person', color: '#7c3aed', bg: '#ede9fe' },
                { name: 'AI Tools Workshop', date: 'Jan 15, 2:00 PM', type: 'Virtual', color: '#10b981', bg: '#d1fae5' },
                { name: 'Design Sprint', date: 'Jan 18, 10:00 AM', type: 'Virtual', color: '#f59e0b', bg: '#fef9c3' },
              ].map((event, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{event.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: event.color, background: event.bg, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginLeft: 8 }}>{event.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{event.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtag suggest */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 12 }}>Your Top Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#Figma', '#NextJS', '#UIDesign', '#Freelance', '#Remote', '#SaaS', '#Branding'].map(tag => (
                <span key={tag} className="badge badge-purple" style={{ cursor: 'pointer' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
