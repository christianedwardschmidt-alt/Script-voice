'use client'

import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Play,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Search,
  Bell,
  Users,
  TrendingUp,
  Hash,
  Plus,
  Send,
  ThumbsUp,
  Repeat2,
} from 'lucide-react'

const posts = [
  {
    id: 1,
    author: 'Sarah Chen',
    handle: '@sarahdesigns',
    avatar: '👩🏻‍💻',
    avatarBg: '#6366f1',
    time: '2h ago',
    type: 'text',
    content: 'Just closed a $12k project for a SaaS rebrand. The key? Showing ROI metrics from past work, not just pretty mockups. Clients buy outcomes, not aesthetics. 🎯',
    likes: 284,
    comments: 47,
    reposts: 62,
    liked: false,
    bookmarked: false,
    tags: ['#freelance', '#design', '#clientwork'],
  },
  {
    id: 2,
    author: 'Marcus Williams',
    handle: '@marcusdev',
    avatar: '👨🏾‍💻',
    avatarBg: '#8b5cf6',
    time: '4h ago',
    type: 'video',
    content: 'Built a full-stack SaaS in 72 hours using Next.js + Supabase + Stripe. Documenting everything in this thread. Part 1: Architecture decisions 🧵',
    videoThumbnail: true,
    likes: 1240,
    comments: 156,
    reposts: 312,
    liked: true,
    bookmarked: true,
    tags: ['#buildinpublic', '#nextjs', '#indiehacker'],
  },
  {
    id: 3,
    author: 'Priya Sharma',
    handle: '@priyafreelance',
    avatar: '👩🏽‍🎨',
    avatarBg: '#06b6d4',
    time: '6h ago',
    type: 'image',
    content: 'My rate card for 2025. Took me 3 years to feel confident charging these numbers. Normalize talking about money in the freelance community 💪',
    imagePlaceholder: true,
    likes: 892,
    comments: 203,
    reposts: 445,
    liked: false,
    bookmarked: true,
    tags: ['#pricing', '#freelancelife', '#transparency'],
  },
  {
    id: 4,
    author: 'James Rodriguez',
    handle: '@jamesbuilds',
    avatar: '👨🏻‍🚀',
    avatarBg: '#10b981',
    time: '8h ago',
    type: 'text',
    content: 'Hot take: The best freelancers aren\'t the most talented — they\'re the most reliable. Clients will pay 2-3x more for someone who delivers on time, every time.',
    likes: 2100,
    comments: 89,
    reposts: 780,
    liked: true,
    bookmarked: false,
    tags: ['#freelancetips', '#business'],
  },
  {
    id: 5,
    author: 'Aisha Johnson',
    handle: '@aishaux',
    avatar: '👩🏿‍🎨',
    avatarBg: '#ec4899',
    time: '12h ago',
    type: 'link',
    content: 'Just published my 2024 annual freelance review. Revenue breakdown, lessons learned, and what I\'m changing in 2025. Spoiler: going from 20 clients to 5 high-value ones.',
    linkPreview: { title: 'My 2024 Freelance Year in Review', url: 'aishajohnsonux.com' },
    likes: 567,
    comments: 124,
    reposts: 198,
    liked: false,
    bookmarked: false,
    tags: ['#yearinreview', '#freelance', '#ux'],
  },
]

const trending = [
  { tag: '#freelancetips', posts: '12.4k' },
  { tag: '#buildinpublic', posts: '8.9k' },
  { tag: '#designsystems', posts: '6.2k' },
  { tag: '#indiehacker', posts: '5.8k' },
  { tag: '#pricing', posts: '4.1k' },
]

const suggestions = [
  { name: 'Tom Blake', handle: '@tomblake', role: 'Content Creator', avatar: '👨🏼‍💼', bg: '#f97316' },
  { name: 'Nina Park', handle: '@ninapark', role: 'UI/UX Designer', avatar: '👩🏻‍🎨', bg: '#a78bfa' },
  { name: 'David Kim', handle: '@davidkimdev', role: 'Full Stack Dev', avatar: '👨🏻‍💻', bg: '#22d3ee' },
]

const card: React.CSSProperties = {
  background: '#0e0e1c',
  border: '1px solid #1a1a30',
  borderRadius: 14,
}

export default function CommunityPage() {
  const [postData, setPostData] = useState(posts)
  const [newPost, setNewPost] = useState('')
  const [activeTab, setActiveTab] = useState('For You')

  const toggleLike = (id: number) => {
    setPostData(prev => prev.map(p => p.id === id
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p
    ))
  }

  const toggleBookmark = (id: number) => {
    setPostData(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p))
  }

  return (
    <div style={{ padding: '28px 32px', background: '#07070f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Community</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Connect with 42,000+ freelancers worldwide</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ width: 36, height: 36, borderRadius: 8, background: '#0e0e1c', border: '1px solid #1a1a30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <Bell size={16} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <Plus size={14} />
            New Post
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Main feed */}
        <div>
          {/* Compose */}
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                ⚡
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your freelance mind?"
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#f1f5f9',
                    fontSize: 14,
                    resize: 'none',
                    outline: 'none',
                    minHeight: 60,
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #1a1a30', paddingTop: 10 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { icon: ImageIcon, label: 'Image' },
                      { icon: Film, label: 'Video' },
                      { icon: LinkIcon, label: 'Link' },
                      { icon: Hash, label: 'Tag' },
                    ].map(({ icon: Icon, label }) => (
                      <button key={label} title={label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6 }}>
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                  <button
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 8,
                      background: newPost.trim() ? '#6366f1' : '#1a1a30',
                      color: newPost.trim() ? '#fff' : '#475569',
                      border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Send size={13} />
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #1a1a30' }}>
            {['For You', 'Following', 'Trending', 'Videos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeTab === tab ? '#6366f1' : '#64748b',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {postData.map((post) => (
              <div key={post.id} style={{ ...card, padding: 18 }}>
                {/* Author */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: post.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {post.avatar}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{post.author}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{post.handle}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{post.time}</div>
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Content */}
                <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.6, marginBottom: 12 }}>{post.content}</p>

                {/* Media */}
                {post.type === 'video' && post.videoThumbnail && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12, background: '#141428', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #252545', cursor: 'pointer' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,102,241,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={20} color="white" fill="white" />
                    </div>
                  </div>
                )}
                {post.type === 'image' && post.imagePlaceholder && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12, background: 'linear-gradient(135deg, #6366f115, #8b5cf615)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #252545' }}>
                    <ImageIcon size={32} color="#475569" />
                  </div>
                )}
                {post.type === 'link' && post.linkPreview && (
                  <div style={{ borderRadius: 10, padding: '12px 14px', marginBottom: 12, background: '#111120', border: '1px solid #1a1a30', cursor: 'pointer' }}>
                    <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 4 }}>{post.linkPreview.url}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{post.linkPreview.title}</div>
                  </div>
                )}

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 12, color: '#6366f1', cursor: 'pointer' }}>{tag}</span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1a1a30', paddingTop: 12 }}>
                  {[
                    { icon: Heart, count: post.likes, active: post.liked, color: '#ef4444', action: () => toggleLike(post.id) },
                    { icon: MessageCircle, count: post.comments, active: false, color: '#6366f1', action: () => {} },
                    { icon: Repeat2, count: post.reposts, active: false, color: '#10b981', action: () => {} },
                  ].map(({ icon: Icon, count, active, color, action }) => (
                    <button
                      key={color}
                      onClick={action}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: active ? color : '#475569',
                        fontSize: 12, fontWeight: active ? 600 : 400,
                        padding: '4px 8px', borderRadius: 6,
                        transition: 'color 0.15s',
                      }}
                    >
                      <Icon size={15} fill={active && Icon === Heart ? color : 'none'} />
                      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                    </button>
                  ))}
                  <button
                    onClick={() => toggleBookmark(post.id)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: post.bookmarked ? '#f59e0b' : '#475569',
                      padding: '4px 8px', borderRadius: 6,
                    }}
                  >
                    <Bookmark size={15} fill={post.bookmarked ? '#f59e0b' : 'none'} />
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px 8px', borderRadius: 6 }}>
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              placeholder="Search community..."
              style={{ width: '100%', padding: '10px 12px 10px 34px', background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 10, color: '#f1f5f9', fontSize: 13, outline: 'none' }}
            />
          </div>

          {/* Community Stats */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Community Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Members', value: '42.1k', color: '#6366f1', icon: Users },
                { label: 'Posts Today', value: '1,284', color: '#10b981', icon: MessageCircle },
                { label: 'Trending', value: '47', color: '#f59e0b', icon: TrendingUp },
                { label: 'Online Now', value: '892', color: '#06b6d4', icon: ThumbsUp },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: '#111120', border: '1px solid #1a1a30' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <Icon size={12} color={color} />
                    <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Trending Topics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trending.map((t, i) => (
                <div key={t.tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#111120', cursor: 'pointer' }} className="card-hover">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#475569', width: 16 }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>{t.tag}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>{t.posts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Who to Follow */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 14 }}>Who to Follow</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                      {s.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{s.role}</div>
                    </div>
                  </div>
                  <button style={{ padding: '5px 12px', borderRadius: 20, background: '#6366f118', border: '1px solid #6366f130', color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
