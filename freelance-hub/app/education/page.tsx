'use client'

import { useState } from 'react'
import { Search, Play, Star, Clock, BookOpen, Award, CheckCircle, Plus } from 'lucide-react'

const courses = [
  { id: 1, title: 'Advanced Figma for Freelancers', instructor: 'Sarah Chen', category: 'Design', duration: '8h 30m', lessons: 42, rating: 4.9, progress: 65, enrolled: true, price: 0, color: '#7c3aed', badge: 'Free' },
  { id: 2, title: 'Full-Stack Next.js', instructor: 'Marcus Williams', category: 'Development', duration: '22h', lessons: 95, rating: 4.8, progress: 30, enrolled: true, price: 79, color: '#10b981', badge: 'Bestseller' },
  { id: 3, title: 'AI Tools for Freelancers', instructor: 'Priya Sharma', category: 'AI & ML', duration: '6h 45m', lessons: 28, rating: 4.9, progress: 0, enrolled: false, price: 49, color: '#f59e0b', badge: 'New' },
  { id: 4, title: 'Freelance Business Mastery', instructor: 'James Rodriguez', category: 'Business', duration: '11h', lessons: 56, rating: 4.7, progress: 100, enrolled: true, price: 89, color: '#ec4899', badge: null },
  { id: 5, title: 'UX Research & Testing', instructor: 'Aisha Johnson', category: 'Design', duration: '9h', lessons: 38, rating: 4.8, progress: 0, enrolled: false, price: 59, color: '#06b6d4', badge: 'Popular' },
  { id: 6, title: 'Content Marketing', instructor: 'Tom Blake', category: 'Marketing', duration: '7h 50m', lessons: 33, rating: 4.6, progress: 0, enrolled: false, price: 39, color: '#78716c', badge: null },
]

const categories = ['All', 'Design', 'Development', 'Business', 'Marketing', 'AI & ML']

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = courses.filter(c => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const enrolled = courses.filter(c => c.enrolled)
  const completed = courses.filter(c => c.progress === 100)

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Upskilling</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Level up your skills with curated courses</p>
        </div>
        <button className="btn-primary"><Plus size={14} /> Browse All</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Enrolled', value: enrolled.length, icon: BookOpen, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
          { label: 'In Progress', value: enrolled.filter(c => c.progress > 0 && c.progress < 100).length, icon: Clock, color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Certificates', value: completed.length, icon: Award, color: '#ec4899', bg: '#fce7f3' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1c1917' }}>{value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Categories */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
          <input className="search-input" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
              background: activeCategory === cat ? '#7c3aed' : '#fff',
              color: activeCategory === cat ? '#fff' : '#6b7280',
              border: activeCategory === cat ? 'none' : '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(course => (
          <div key={course.id} className="card card-hover" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Thumbnail */}
            <div style={{ height: 110, background: `linear-gradient(135deg, ${course.color}22, ${course.color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: course.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={22} color={course.color} />
              </div>
              {course.badge && (
                <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: course.color, background: 'var(--card)', padding: '2px 8px', borderRadius: 10, border: `1px solid ${course.color}30` }}>
                  {course.badge}
                </span>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: course.color, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 5 }}>{course.category}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 3, lineHeight: 1.4 }}>{course.title}</div>
              <div style={{ fontSize: 12, color: '#78716c', marginBottom: 10 }}>by {course.instructor}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#78716c' }}>
                  <Star size={10} fill="#f59e0b" color="#f59e0b" /> {course.rating}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#78716c' }}>
                  <Clock size={10} /> {course.duration}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#78716c' }}>
                  <Play size={10} /> {course.lessons} lessons
                </span>
              </div>
              {course.enrolled ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#78716c' }}>Progress</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: course.progress === 100 ? '#10b981' : '#7c3aed' }}>{course.progress}%</span>
                  </div>
                  <div style={{ height: 5, background: '#f7f6f3', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? '#10b981' : '#7c3aed', borderRadius: 3 }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>{course.price === 0 ? 'Free' : `$${course.price}`}</span>
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>Enroll</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
