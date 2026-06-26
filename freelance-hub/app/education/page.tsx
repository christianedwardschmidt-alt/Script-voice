'use client'

import { useState } from 'react'
import {
  BookOpen,
  Play,
  Clock,
  Star,
  Award,
  TrendingUp,
  ChevronRight,
  Search,
  Filter,
  CheckCircle,
  Lock,
  Zap,
} from 'lucide-react'

const categories = ['All', 'Design', 'Development', 'Business', 'Marketing', 'AI & ML']

const courses = [
  {
    id: 1,
    title: 'Advanced Figma for Freelancers',
    instructor: 'Sarah Chen',
    category: 'Design',
    duration: '8h 30m',
    lessons: 42,
    rating: 4.9,
    students: 12840,
    progress: 65,
    price: 0,
    badge: 'Free',
    badgeColor: '#10b981',
    thumbnail: '#6366f1',
    skills: ['Auto Layout', 'Variables', 'Prototyping'],
    enrolled: true,
  },
  {
    id: 2,
    title: 'Full-Stack Development with Next.js',
    instructor: 'Marcus Williams',
    category: 'Development',
    duration: '22h 15m',
    lessons: 95,
    rating: 4.8,
    students: 8920,
    progress: 30,
    price: 79,
    badge: 'Bestseller',
    badgeColor: '#f59e0b',
    thumbnail: '#8b5cf6',
    skills: ['React', 'TypeScript', 'Databases'],
    enrolled: true,
  },
  {
    id: 3,
    title: 'AI Tools for Creative Freelancers',
    instructor: 'Priya Sharma',
    category: 'AI & ML',
    duration: '6h 45m',
    lessons: 28,
    rating: 4.9,
    students: 23100,
    progress: 0,
    price: 49,
    badge: 'New',
    badgeColor: '#6366f1',
    thumbnail: '#06b6d4',
    skills: ['Prompt Eng.', 'Midjourney', 'ChatGPT'],
    enrolled: false,
  },
  {
    id: 4,
    title: 'Freelance Business Mastery',
    instructor: 'James Rodriguez',
    category: 'Business',
    duration: '11h 20m',
    lessons: 56,
    rating: 4.7,
    students: 15670,
    progress: 100,
    price: 89,
    badge: 'Completed',
    badgeColor: '#10b981',
    thumbnail: '#10b981',
    skills: ['Pricing', 'Contracts', 'Client Mgmt'],
    enrolled: true,
  },
  {
    id: 5,
    title: 'UX Research & User Testing',
    instructor: 'Aisha Johnson',
    category: 'Design',
    duration: '9h 10m',
    lessons: 38,
    rating: 4.8,
    students: 9340,
    progress: 0,
    price: 59,
    badge: 'Popular',
    badgeColor: '#ec4899',
    thumbnail: '#ec4899',
    skills: ['Interviews', 'Usability', 'Analytics'],
    enrolled: false,
  },
  {
    id: 6,
    title: 'Content Marketing for Freelancers',
    instructor: 'Tom Blake',
    category: 'Marketing',
    duration: '7h 50m',
    lessons: 33,
    rating: 4.6,
    students: 7820,
    progress: 0,
    price: 39,
    badge: null,
    badgeColor: '',
    thumbnail: '#f97316',
    skills: ['SEO', 'Social Media', 'Email'],
    enrolled: false,
  },
]

const achievements = [
  { icon: Award, label: 'Design Expert', color: '#6366f1', earned: true },
  { icon: Zap, label: 'Fast Learner', color: '#f59e0b', earned: true },
  { icon: TrendingUp, label: 'Top Performer', color: '#10b981', earned: false },
  { icon: Star, label: 'Course Champion', color: '#ec4899', earned: false },
]

const card: React.CSSProperties = {
  background: '#0e0e1c',
  border: '1px solid #1a1a30',
  borderRadius: 14,
  padding: 20,
}

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = courses.filter((c) => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const completedCount = courses.filter((c) => c.progress === 100).length
  const enrolledCount = courses.filter((c) => c.enrolled).length
  const totalHours = courses.filter((c) => c.enrolled).reduce((acc, c) => {
    return acc + parseFloat(c.duration.split('h')[0])
  }, 0)

  return (
    <div style={{ padding: '28px 32px', background: '#07070f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Education & Upskilling
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Level up your skills with curated courses for freelancers
          </p>
        </div>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 8,
            background: '#6366f1',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(99,102,241,0.3)',
          }}
        >
          <BookOpen size={14} />
          Browse Catalog
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Enrolled', value: enrolledCount, icon: BookOpen, color: '#6366f1' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: '#10b981' },
          { label: 'Hours Learned', value: `${Math.round(totalHours)}h`, icon: Clock, color: '#8b5cf6' },
          { label: 'Certificates', value: completedCount, icon: Award, color: '#f59e0b' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card-hover" style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>{stat.value}</div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={stat.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: '#0e0e1c',
                  border: '1px solid #1a1a30',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <button style={{ padding: '10px 14px', background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 8, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: activeCategory === cat ? 600 : 400,
                  background: activeCategory === cat ? '#6366f1' : '#0e0e1c',
                  color: activeCategory === cat ? '#fff' : '#64748b',
                  border: activeCategory === cat ? 'none' : '1px solid #1a1a30',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {filtered.map((course) => (
              <div key={course.id} className="card-hover" style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {/* Thumbnail */}
                <div
                  style={{
                    height: 120,
                    background: `linear-gradient(135deg, ${course.thumbnail}33, ${course.thumbnail}11)`,
                    borderBottom: `1px solid ${course.thumbnail}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `${course.thumbnail}30`, border: `1px solid ${course.thumbnail}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={22} color={course.thumbnail} />
                  </div>
                  {course.badge && (
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: course.badgeColor, background: `${course.badgeColor}18`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${course.badgeColor}40` }}>
                      {course.badge}
                    </span>
                  )}
                  {!course.enrolled && (
                    <div style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={12} color="#94a3b8" />
                    </div>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 10, color: course.thumbnail, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>
                    {course.category}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4, lineHeight: 1.4 }}>
                    {course.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>by {course.instructor}</div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.rating}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="#475569" />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{course.duration}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Play size={11} color="#475569" />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{course.lessons} lessons</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {course.skills.map((skill) => (
                      <span key={skill} style={{ fontSize: 10, color: '#6366f1', background: '#6366f118', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Progress or Price */}
                  {course.enrolled ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Progress</span>
                        <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{course.progress}%</span>
                      </div>
                      <div style={{ height: 4, background: '#1a1a30', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? '#10b981' : '#6366f1', borderRadius: 2, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                      <button style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Enroll
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Achievements */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Achievements</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {achievements.map(({ icon: Icon, label, color, earned }) => (
                <div key={label} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: earned ? `${color}10` : '#111120', border: `1px solid ${earned ? color + '30' : '#1a1a30'}`, opacity: earned ? 1 : 0.5 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Icon size={17} color={earned ? color : '#475569'} />
                  </div>
                  <div style={{ fontSize: 11, color: earned ? '#f1f5f9' : '#475569', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Streak */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Learning Streak</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Keep it going!</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '100%', paddingBottom: '100%', borderRadius: 6, background: i < 5 ? '#6366f1' : '#1a1a30', marginBottom: 4 }} />
                  <div style={{ fontSize: 9, color: '#475569' }}>{d}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#6366f110', borderRadius: 8, border: '1px solid #6366f120' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>14 days</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Current streak</div>
            </div>
          </div>

          {/* Recommended */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 16 }}>Recommended</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {courses.filter(c => !c.enrolled).slice(0, 2).map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${c.thumbnail}20`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={16} color={c.thumbnail} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{c.instructor}</div>
                  </div>
                  <ChevronRight size={14} color="#475569" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
