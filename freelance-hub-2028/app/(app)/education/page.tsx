'use client'

import { useEffect, useState } from 'react'
import { Search, Play, Star, Clock, BookOpen, Award, CheckCircle } from 'lucide-react'

interface Course {
  id: number
  title: string
  instructor: string
  category: string
  duration: string
  lessons: number
  rating: number
  progress: number
  enrolled: boolean
  price: number
  color: string
  badge: string | null
}

const categories = ['All', 'Design', 'Development', 'Business', 'Marketing', 'AI & ML']

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
      <Star size={10} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0 }} />
      {rating.toFixed(1)}
    </span>
  )
}

export default function EducationPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(rows => { setCourses(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  const enroll = async (id: number) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, enrolled: true, progress: 0 } : c))
    await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrolled: true, progress: 0 }),
    })
  }

  const filtered = courses.filter(c => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const enrolled = courses.filter(c => c.enrolled)
  const completed = courses.filter(c => c.progress === 100)
  const inProgress = enrolled.filter(c => c.progress > 0 && c.progress < 100)

  const stats = [
    { label: 'Enrolled',    value: enrolled.length,   icon: BookOpen,    color: '#16A34A' },
    { label: 'Completed',   value: completed.length,  icon: CheckCircle, color: '#10B981' },
    { label: 'In Progress', value: inProgress.length, icon: Clock,       color: '#D97706' },
    { label: 'Certificates', value: completed.length, icon: Award,       color: '#6366F1' },
  ]

  return (
    <div style={{ padding: '40px 32px 52px', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Upskilling
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6B7280' }}>
            Level up your skills with curated courses
          </p>
        </div>
      </div>

      {/* Stats unified bar */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 28,
      }} className="dash-kpi-grid">
        {stats.map((stat, i) => (
          <div key={stat.label} style={{ padding: '22px 28px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <stat.icon size={12} color={stat.color} />
              <span style={{ fontSize: 11, color: stat.color, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {stat.label === 'Enrolled' ? 'courses enrolled' : stat.label === 'Completed' ? 'finished' : stat.label === 'In Progress' ? 'active now' : 'earned'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* In-progress courses — only if any */}
      {inProgress.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 24px', marginBottom: 20, borderTop: '2px solid #16A34A' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 14 }}>CONTINUE LEARNING</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {inProgress.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F3F4F6', minWidth: 240, flex: '1 1 240px', maxWidth: 340 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={16} color={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{c.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: c.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color, fontFamily: 'var(--font-body)', flexShrink: 0 }}>{c.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              borderRadius: 10, border: '1px solid #E5E7EB',
              background: 'white', fontSize: 13, fontFamily: 'var(--font-body)',
              color: '#111827', outline: 'none', width: 240,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontFamily: 'var(--font-body)',
                fontWeight: activeCategory === cat ? 600 : 400,
                background: activeCategory === cat ? '#16A34A' : 'white',
                color: activeCategory === cat ? '#fff' : '#6B7280',
                border: activeCategory === cat ? 'none' : '1px solid #E5E7EB',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>
          Loading courses…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)' }}>
          No courses match your search
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {filtered.map(course => (
            <div key={course.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Color strip header */}
              <div style={{
                height: 6,
                background: `linear-gradient(90deg, ${course.color}, ${course.color}88)`,
              }} />
              <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Category + badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: course.color, fontFamily: 'var(--font-body)' }}>{course.category}</span>
                  {course.badge && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: course.color, background: course.color + '15', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-body)' }}>{course.badge}</span>
                  )}
                </div>
                {/* Title */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.35, marginBottom: 5 }}>{course.title}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 14 }}>by {course.instructor}</div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <StarRating rating={course.rating} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                    <Clock size={10} /> {course.duration}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                    <Play size={10} /> {course.lessons} lessons
                  </span>
                </div>

                {/* Progress or enroll */}
                <div style={{ marginTop: 'auto' }}>
                  {course.enrolled ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Progress</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: course.progress === 100 ? '#10B981' : course.color, fontFamily: 'var(--font-body)' }}>{course.progress}%</span>
                      </div>
                      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? '#10B981' : course.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                      {course.progress === 100 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                          <Award size={12} color="#10B981" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', fontFamily: 'var(--font-body)' }}>Certificate earned</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#111827' }}>
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                      <button
                        onClick={() => enroll(course.id)}
                        style={{
                          padding: '7px 16px', borderRadius: 9, border: 'none',
                          background: '#16A34A', color: '#fff',
                          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                          cursor: 'pointer', transition: 'opacity 0.15s',
                        }}
                      >Enroll</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
