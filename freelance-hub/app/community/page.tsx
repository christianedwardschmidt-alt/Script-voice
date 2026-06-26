'use client'

import { useState } from 'react'
import { Bookmark, Heart, MessageCircle, Share2, MoreHorizontal, TrendingUp, Users, Award } from 'lucide-react'

const trending = [
  { tag: '#FreelanceLife', posts: '12.4k posts' },
  { tag: '#WebDesign2026', posts: '8.9k posts' },
  { tag: '#AITools', posts: '15.2k posts' },
  { tag: '#RemoteWork', posts: '9.7k posts' },
]

const suggested = [
  { name: 'Alex Thom...', role: 'Brand Designer', mutual: 12, avatar: '👨🏼‍🎨', color: '#7c3aed' },
  { name: 'Jessica Wu', role: 'Marketing Expert', mutual: 8, avatar: '👩🏻‍💼', color: '#ec4899' },
  { name: 'David Park', role: 'Video Creator', mutual: 5, avatar: '👨🏻‍💻', color: '#f59e0b' },
]

const posts = [
  {
    id: 1,
    author: 'Sarah Johnson',
    role: 'Senior UI/UX Designer',
    avatar: '👩🏻‍🎨',
    color: '#7c3aed',
    time: '2 hours ago',
    trending: true,
    content: 'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off. Here\'s what worked for me...',
    hasImage: true,
    likes: 142,
    comments: 38,
    liked: false,
    saved: false,
  },
  {
    id: 2,
    author: 'Marcus Williams',
    role: 'Full Stack Developer',
    avatar: '👨🏾‍💻',
    color: '#10b981',
    time: '5 hours ago',
    trending: false,
    content: 'Hot take: The single best thing I did for my freelance career was raising my rates. Went from $85/hr to $150/hr and actually got more serious clients. Price is a signal.',
    hasImage: false,
    likes: 287,
    comments: 64,
    liked: true,
    saved: false,
  },
  {
    id: 3,
    author: 'Priya Sharma',
    role: 'UX Researcher',
    avatar: '👩🏽‍💻',
    color: '#f59e0b',
    time: '1 day ago',
    trending: false,
    content: 'Sharing my freelance contract template — took me 2 years and one bad client experience to get right. DM me if you want the full version.',
    hasImage: false,
    likes: 512,
    comments: 97,
    liked: false,
    saved: true,
  },
]

const tabs = ['Feed', 'Trending', 'Saved']

export default function CommunityPage() {
  const [postData, setPostData] = useState(posts)
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

  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Community</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>Connect, share, and grow with fellow freelancers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 20 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Trending Topics */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#111827' }}>
              <TrendingUp size={15} color="#7c3aed" />
              Trending Topics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trending.map(t => (
                <div key={t.tag} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>{t.tag}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.posts}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Connections */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontWeight: 600, fontSize: 14, color: '#111827' }}>
              <Users size={15} color="#7c3aed" />
              Suggested Connections
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggested.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {s.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.role}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.mutual} mutual</div>
                  </div>
                  <button style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', flexShrink: 0 }}>
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 18px', border: 'none', background: 'none', fontSize: 14,
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#111827' : '#9ca3af',
                  borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
                  cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Compose */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share your thoughts..."
                style={{ flex: 1, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#111827', resize: 'none', outline: 'none', minHeight: 48, fontFamily: 'inherit' }}
              />
              <button className="btn-primary" style={{ flexShrink: 0 }}>Post</button>
            </div>
          </div>

          {/* Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {postData.map(post => (
              <div key={post.id} className="card" style={{ padding: 18 }}>
                {post.trending && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                    🔥 Trending
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: post.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {post.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{post.author}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{post.role} · {post.time}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleSave(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.saved ? '#f59e0b' : '#9ca3af' }}>
                      <Bookmark size={16} fill={post.saved ? '#f59e0b' : 'none'} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: post.hasImage ? 12 : 0 }}>{post.content}</p>

                {post.hasImage && (
                  <div style={{ height: 200, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #fce7f3)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🖼</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Community photo</div>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 10, display: 'flex', gap: 20 }}>
                  {[
                    { icon: Heart, count: post.likes, active: post.liked, action: () => toggleLike(post.id), activeColor: '#ef4444' },
                    { icon: MessageCircle, count: post.comments, active: false, action: () => {}, activeColor: '#7c3aed' },
                    { icon: Share2, count: null, active: false, action: () => {}, activeColor: '#7c3aed' },
                  ].map(({ icon: Icon, count, active, action, activeColor }, i) => (
                    <button key={i} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: active ? activeColor : '#9ca3af', fontSize: 13, fontWeight: active ? 600 : 400 }}>
                      <Icon size={15} fill={active && Icon === Heart ? activeColor : 'none'} />
                      {count !== null && count}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Contributor */}
          <div style={{ background: '#7c3aed', borderRadius: 16, padding: 20, color: '#fff' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Award size={20} color="#fff" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Top Contributor</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>You're in the top 15% this month!</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>247</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Community Points</div>
          </div>

          {/* Upcoming Events */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 14 }}>Upcoming Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Freelance Meetup', date: 'Tomorrow, 6:00 PM' },
                { name: 'Web3 Workshop', date: 'Jan 15, 2:00 PM' },
                { name: 'Design Sprint', date: 'Jan 18, 10:00 AM' },
              ].map((event, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{event.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{event.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
