import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

declare global {
  // eslint-disable-next-line no-var
  var __lanceflo_db: Database.Database | undefined
}

function createConnection() {
  const db = new Database(path.join(dataDir, 'lanceflo.db'))
  db.pragma('journal_mode = WAL')
  return db
}

const db = globalThis.__lanceflo_db ?? createConnection()
if (process.env.NODE_ENV !== 'production') globalThis.__lanceflo_db = db

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    avatar TEXT,
    color TEXT,
    status TEXT,
    revenue INTEGER DEFAULT 0,
    projects INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS crm_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    stage TEXT,
    value INTEGER DEFAULT 0,
    avatar TEXT,
    avatarBg TEXT,
    tags TEXT,
    lastContact TEXT,
    starred INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 0,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT,
    status TEXT,
    dueDate TEXT,
    project TEXT,
    integrations TEXT,
    checked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    project TEXT,
    amount INTEGER DEFAULT 0,
    status TEXT,
    issued TEXT,
    due TEXT,
    avatar TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    type TEXT,
    budget TEXT,
    posted TEXT,
    tags TEXT,
    description TEXT,
    rating REAL,
    reviews INTEGER,
    saved INTEGER DEFAULT 0,
    applied INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    instructor TEXT,
    category TEXT,
    duration TEXT,
    lessons INTEGER,
    rating REAL,
    progress INTEGER DEFAULT 0,
    enrolled INTEGER DEFAULT 0,
    price INTEGER DEFAULT 0,
    color TEXT,
    badge TEXT
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    desc TEXT,
    icon TEXT,
    connected INTEGER DEFAULT 0,
    lastSync TEXT,
    category TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    handle TEXT,
    role TEXT,
    avatar TEXT,
    color TEXT,
    time TEXT,
    trending INTEGER DEFAULT 0,
    content TEXT,
    image TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    liked INTEGER DEFAULT 0,
    saved INTEGER DEFAULT 0,
    reposted INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY,
    displayName TEXT,
    email TEXT,
    headline TEXT,
    skills TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    notifications INTEGER DEFAULT 1,
    twoFactor INTEGER DEFAULT 0,
    darkMode INTEGER DEFAULT 0,
    invoiceAutoSend INTEGER DEFAULT 1,
    weeklyDigest INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS contact_info (
    id INTEGER PRIMARY KEY,
    fullName TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    location TEXT,
    timezone TEXT,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS tax_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    icon TEXT,
    max INTEGER DEFAULT 0,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS tax_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT,
    date TEXT,
    size TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    createdAt TEXT
  );
`)

function seedIfEmpty(table: string, seedFn: () => void) {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
  if (count === 0) seedFn()
}

seedIfEmpty('clients', () => {
  const stmt = db.prepare(`INSERT INTO clients (name, company, email, phone, website, avatar, color, status, revenue, projects) VALUES (@name, @company, @email, @phone, @website, @avatar, @color, @status, @revenue, @projects)`)
  const rows = [
    { name: 'Emma Thompson', company: 'Tech Trophey', email: 'emma@techtrophey.com', phone: '+1 (555) 234-5678', website: 'techtrophey.com', avatar: '👩🏻‍💼', color: '#16a34a', status: 'active', revenue: 24500, projects: 5 },
    { name: 'James Park', company: 'Hencewood Digital', email: 'james@hencewood.io', phone: '+1 (555) 345-6789', website: 'hencewood.io', avatar: '👨🏻‍💻', color: '#ec4899', status: 'active', revenue: 18200, projects: 3 },
    { name: 'Aisha Williams', company: 'Margono Studio', email: 'aisha@margono.co', phone: '+1 (555) 456-7890', website: 'margono.co', avatar: '👩🏿‍💼', color: '#f59e0b', status: 'active', revenue: 15800, projects: 4 },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('crm_clients', () => {
  const stmt = db.prepare(`INSERT INTO crm_clients (name, company, email, phone, website, stage, value, avatar, avatarBg, tags, lastContact, starred, rating, notes) VALUES (@name, @company, @email, @phone, @website, @stage, @value, @avatar, @avatarBg, @tags, @lastContact, @starred, @rating, @notes)`)
  const rows = [
    { name: 'Emma Thompson', company: 'Acme Corp', email: 'emma@acmecorp.com', phone: '+1 (555) 234-5678', website: 'acmecorp.com', stage: 'Active', value: 18500, avatar: '👩🏻‍💼', avatarBg: '#16a34a', tags: JSON.stringify(['Design', 'Retainer']), lastContact: '1h ago', starred: 1, rating: 5, notes: 'Long-term client. Pays on time. Expanding to mobile app.' },
    { name: 'James Park', company: 'TechFlow Inc', email: 'jpark@techflow.io', phone: '+1 (555) 345-6789', website: 'techflow.io', stage: 'Proposal', value: 12000, avatar: '👨🏻‍💻', avatarBg: '#22c55e', tags: JSON.stringify(['Development', 'API']), lastContact: '3h ago', starred: 0, rating: 4, notes: 'Needs detailed scope. Budget is flexible if scope is clear.' },
    { name: 'Aisha Williams', company: 'Bright Ideas Co', email: 'aisha@brightideas.co', phone: '+1 (555) 456-7890', website: 'brightideas.co', stage: 'Negotiation', value: 9800, avatar: '👩🏿‍💼', avatarBg: '#d97706', tags: JSON.stringify(['Marketing', 'Content']), lastContact: '1d ago', starred: 1, rating: 4, notes: 'Negotiating on timeline. They want delivery in 3 weeks.' },
    { name: 'Carlos Mendez', company: 'DataSync', email: 'carlos@datasync.io', phone: '+1 (555) 567-8901', website: 'datasync.io', stage: 'Active', value: 24000, avatar: '👨🏽‍💼', avatarBg: '#14b8a6', tags: JSON.stringify(['Development', 'Data', 'Premium']), lastContact: '2d ago', starred: 0, rating: 5, notes: 'High-value client. Careful with deadlines. C-level contacts.' },
    { name: 'Sophie Laurent', company: 'NovaBuild', email: 'sophie@novabuild.fr', phone: '+33 1 23 45 67 89', website: 'novabuild.fr', stage: 'Lead', value: 35000, avatar: '👩🏻‍🎨', avatarBg: '#78716c', tags: JSON.stringify(['Design', 'Enterprise', 'New']), lastContact: '3d ago', starred: 1, rating: 3, notes: 'Warm lead from LinkedIn. Need to schedule discovery call.' },
    { name: 'Raj Patel', company: 'InnovateTech', email: 'raj@innovatetech.in', phone: '+91 98765 43210', website: 'innovatetech.in', stage: 'Completed', value: 8200, avatar: '👨🏽‍💻', avatarBg: '#4ade80', tags: JSON.stringify(['Development', 'Completed']), lastContact: '2w ago', starred: 0, rating: 4, notes: 'Project completed successfully. Ask for referral.' },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('tasks', () => {
  const stmt = db.prepare(`INSERT INTO tasks (title, description, priority, status, dueDate, project, integrations, checked) VALUES (@title, @description, @priority, @status, @dueDate, @project, @integrations, @checked)`)
  const rows = [
    { title: 'Complete website redesign mockups', description: 'Create high-fidelity mockups for the client homepage and product pages', priority: 'high', status: 'in progress', dueDate: 'Jan 14', project: 'Tech Trophey Website', integrations: JSON.stringify(['figma', 'slack', 'google']), checked: 0 },
    { title: 'Review frontend code pull request', description: 'Check the new React components for best practices', priority: 'medium', status: 'todo', dueDate: 'Jan 12', project: 'Hencewood Digital', integrations: JSON.stringify(['github', 'slack']), checked: 0 },
    { title: 'Client meeting - Project kickoff', description: 'Discuss project scope and timeline with new client', priority: 'high', status: 'todo', dueDate: 'Jan 11', project: 'Margono Studio', integrations: JSON.stringify(['slack']), checked: 0 },
    { title: 'Update portfolio website', description: 'Add recent case studies and update project showcase', priority: 'low', status: 'todo', dueDate: 'Jan 20', project: 'Personal', integrations: JSON.stringify([]), checked: 0 },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('invoices', () => {
  const stmt = db.prepare(`INSERT INTO invoices (id, client, project, amount, status, issued, due, avatar, color) VALUES (@id, @client, @project, @amount, @status, @issued, @due, @avatar, @color)`)
  const rows = [
    { id: 'INV-089', client: 'Tech Trophey', project: 'Brand Redesign Q4', amount: 4800, status: 'Paid', issued: 'Nov 15', due: 'Dec 15', avatar: '👩🏻‍💼', color: '#16a34a' },
    { id: 'INV-090', client: 'Hencewood Digital', project: 'API Integration', amount: 3200, status: 'Pending', issued: 'Dec 1', due: 'Jan 1', avatar: '👨🏻‍💻', color: '#ec4899' },
    { id: 'INV-088', client: 'Margono Studio', project: 'Dashboard UI', amount: 8400, status: 'Overdue', issued: 'Oct 20', due: 'Nov 20', avatar: '👩🏿‍💼', color: '#f59e0b' },
    { id: 'INV-091', client: 'NovaBuild', project: 'Mobile App', amount: 2100, status: 'Draft', issued: 'Dec 20', due: 'Jan 20', avatar: '👨🏽‍💼', color: '#10b981' },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('jobs', () => {
  const stmt = db.prepare(`INSERT INTO jobs (title, company, location, type, budget, posted, tags, description, rating, reviews, saved, applied) VALUES (@title, @company, @location, @type, @budget, @posted, @tags, @description, @rating, @reviews, @saved, 0)`)
  const rows = [
    { title: 'Senior UI/UX Designer', company: 'Stripe', location: 'Remote', type: 'Contract', budget: '$120–160/hr', posted: '2h ago', tags: JSON.stringify(['Figma', 'Design Systems', 'React']), description: 'Looking for an experienced designer to lead our dashboard redesign. 3-month engagement.', rating: 4.9, reviews: 24, saved: 0 },
    { title: 'Full Stack Next.js Developer', company: 'Vercel', location: 'Remote', type: 'Project', budget: '$18,000 fixed', posted: '5h ago', tags: JSON.stringify(['Next.js', 'TypeScript', 'PostgreSQL']), description: 'Build a SaaS analytics platform from scratch. Solo project, 2 months timeline.', rating: 4.7, reviews: 18, saved: 1 },
    { title: 'Brand Identity Designer', company: 'Linear', location: 'Hybrid', type: 'Contract', budget: '$90–110/hr', posted: '1d ago', tags: JSON.stringify(['Branding', 'Illustration', 'Motion']), description: 'Refreshing our brand identity. Need a creative who understands B2B SaaS.', rating: 4.8, reviews: 31, saved: 0 },
    { title: 'React Native Developer', company: 'Notion', location: 'Remote', type: 'Retainer', budget: '$8,500/mo', posted: '2d ago', tags: JSON.stringify(['React Native', 'iOS', 'Android']), description: 'Ongoing mobile app development. 20 hrs/week retainer arrangement.', rating: 5.0, reviews: 12, saved: 0 },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('courses', () => {
  const stmt = db.prepare(`INSERT INTO courses (title, instructor, category, duration, lessons, rating, progress, enrolled, price, color, badge) VALUES (@title, @instructor, @category, @duration, @lessons, @rating, @progress, @enrolled, @price, @color, @badge)`)
  const rows = [
    { title: 'Advanced Figma for Freelancers', instructor: 'Sarah Chen', category: 'Design', duration: '8h 30m', lessons: 42, rating: 4.9, progress: 65, enrolled: 1, price: 0, color: '#16a34a', badge: 'Free' },
    { title: 'Full-Stack Next.js', instructor: 'Marcus Williams', category: 'Development', duration: '22h', lessons: 95, rating: 4.8, progress: 30, enrolled: 1, price: 79, color: '#10b981', badge: 'Bestseller' },
    { title: 'AI Tools for Freelancers', instructor: 'Priya Sharma', category: 'AI & ML', duration: '6h 45m', lessons: 28, rating: 4.9, progress: 0, enrolled: 0, price: 49, color: '#f59e0b', badge: 'New' },
    { title: 'Freelance Business Mastery', instructor: 'James Rodriguez', category: 'Business', duration: '11h', lessons: 56, rating: 4.7, progress: 100, enrolled: 1, price: 89, color: '#ec4899', badge: null },
    { title: 'UX Research & Testing', instructor: 'Aisha Johnson', category: 'Design', duration: '9h', lessons: 38, rating: 4.8, progress: 0, enrolled: 0, price: 59, color: '#06b6d4', badge: 'Popular' },
    { title: 'Content Marketing', instructor: 'Tom Blake', category: 'Marketing', duration: '7h 50m', lessons: 33, rating: 4.6, progress: 0, enrolled: 0, price: 39, color: '#78716c', badge: null },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('integrations', () => {
  const stmt = db.prepare(`INSERT INTO integrations (id, name, desc, icon, connected, lastSync, category, color) VALUES (@id, @name, @desc, @icon, @connected, @lastSync, @category, @color)`)
  const rows = [
    { id: 'ms365', name: 'Microsoft 365', desc: 'Word, Excel, PowerPoint, Outlook & Teams', icon: '🪟', connected: 1, lastSync: '2 min ago', category: 'Productivity', color: '#0078d4' },
    { id: 'notion', name: 'Notion', desc: 'All-in-one workspace for notes and docs', icon: '◼', connected: 1, lastSync: '5 min ago', category: 'Productivity', color: '#1c1917' },
    { id: 'slack', name: 'Slack', desc: 'Team communication and collaboration', icon: '💬', connected: 1, lastSync: '1 min ago', category: 'Productivity', color: '#4a154b' },
    { id: 'figma', name: 'Figma', desc: 'Collaborative design and prototyping', icon: '🎨', connected: 1, lastSync: '10 min ago', category: 'Design', color: '#f24e1e' },
    { id: 'adobe', name: 'Adobe Creative Cloud', desc: 'Photoshop, Illustrator, XD & more', icon: '🔴', connected: 0, lastSync: null, category: 'Design', color: '#ff0000' },
    { id: 'github', name: 'GitHub', desc: 'Version control and code collaboration', icon: '🐙', connected: 1, lastSync: '3 min ago', category: 'Development', color: '#1c1917' },
    { id: 'vscode', name: 'VS Code', desc: 'Code editor with extensions and sync', icon: '💙', connected: 1, lastSync: '15 min ago', category: 'Development', color: '#007acc' },
    { id: 'vercel', name: 'Vercel', desc: 'Frontend deployment and edge network', icon: '▲', connected: 0, lastSync: null, category: 'Development', color: '#1c1917' },
    { id: 'stripe', name: 'Stripe', desc: 'Payment processing and subscriptions', icon: '💳', connected: 1, lastSync: '1 min ago', category: 'Finance', color: '#6772e5' },
    { id: 'wise', name: 'Wise', desc: 'International transfers and multi-currency', icon: '🌍', connected: 1, lastSync: '20 min ago', category: 'Finance', color: '#9fe870' },
    { id: 'quickbooks', name: 'QuickBooks', desc: 'Accounting software for freelancers', icon: '📊', connected: 0, lastSync: null, category: 'Finance', color: '#2ca01c' },
    { id: 'canva', name: 'Canva', desc: 'Quick design tool for social media', icon: '🖼', connected: 0, lastSync: null, category: 'Design', color: '#00c4cc' },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('posts', () => {
  const stmt = db.prepare(`INSERT INTO posts (author, handle, role, avatar, color, time, trending, content, image, likes, comments, shares, views, liked, saved, reposted, createdAt) VALUES (@author, @handle, @role, @avatar, @color, @time, @trending, @content, @image, @likes, @comments, @shares, @views, @liked, @saved, @reposted, @createdAt)`)
  const rows = [
    { author: 'Sarah Johnson', handle: '@sarahj_ux', role: 'Senior UI/UX Designer', avatar: '👩🏻‍🎨', color: '#16a34a', time: '2h', trending: 1, content: 'Just landed my biggest client yet! 🎉 After months of building my portfolio and networking, persistence really pays off.\n\nHere\'s what worked for me:\n→ Niching down to SaaS dashboards only\n→ Cold outreach with a custom Loom video\n→ Packaging services at 3 clear price points\n\nThe journey is everything. Keep going. 💜', image: JSON.stringify({ type: 'design', label: 'Dashboard Redesign Preview', emoji: '🖥', grad: 'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)' }), likes: 142, comments: 38, shares: 21, views: 8400, liked: 0, saved: 0, reposted: 0, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { author: 'Marcus Williams', handle: '@marcusdev', role: 'Full Stack Developer', avatar: '👨🏾‍💻', color: '#10b981', time: '5h', trending: 0, content: 'Hot take: The single best thing I did for my freelance career was raising my rates.\n\nWent from $85/hr → $150/hr and actually got MORE serious clients.\n\nPrice is a signal. Premium pricing filters out problem clients automatically. Don\'t under-price to win — it signals risk.', image: JSON.stringify({ type: 'chart', label: 'Revenue Growth 2025→2026', emoji: '📈', grad: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)' }), likes: 287, comments: 64, shares: 89, views: 21300, liked: 1, saved: 0, reposted: 0, createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
    { author: 'Priya Sharma', handle: '@priya_uxr', role: 'UX Researcher', avatar: '👩🏽‍💻', color: '#f59e0b', time: '1d', trending: 0, content: 'Sharing my freelance contract template — took me 2 years and one bad client experience to get right.\n\nIncludes:\n✅ Scope of work clauses\n✅ Revision limits\n✅ Kill fee (25% if client cancels)\n✅ IP ownership on final payment\n\nDM me for the full version. No strings.', image: null, likes: 512, comments: 97, shares: 203, views: 34100, liked: 0, saved: 1, reposted: 0, createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    { author: 'Tom Blake', handle: '@tomblake_brand', role: 'Brand Strategist', avatar: '👨🏼‍💼', color: '#06b6d4', time: '2d', trending: 0, content: 'My home office setup after 3 years of freelancing. The monitor arm was a game changer. 🖥\n\nTools I swear by:\n• Standing desk (health investment)\n• Good mic (clients notice)\n• Notion + LanceFlo for project tracking\n\nWhat\'s your must-have setup piece?', image: JSON.stringify({ type: 'photo', label: 'Home Office Setup', emoji: '🖥', grad: 'linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)' }), likes: 94, comments: 41, shares: 7, views: 5200, liked: 0, saved: 0, reposted: 1, createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('profile', () => {
  db.prepare(`INSERT INTO profile (id, displayName, email, headline, skills) VALUES (1, ?, ?, ?, ?)`)
    .run('Christian Schmidt', 'christian@freelance.io', 'Full Stack Developer & UI Designer', 'React, TypeScript, Figma, Next.js')
})

seedIfEmpty('settings', () => {
  db.prepare(`INSERT INTO settings (id, notifications, twoFactor, darkMode, invoiceAutoSend, weeklyDigest) VALUES (1, 1, 0, 0, 1, 1)`).run()
})

seedIfEmpty('contact_info', () => {
  db.prepare(`INSERT INTO contact_info (id, fullName, email, phone, website, location, timezone, bio) VALUES (1, ?, ?, ?, ?, ?, ?, ?)`)
    .run('Christian Schmidt', 'christian@freelance.io', '+1 (555) 000-0000', 'yoursite.com', 'San Francisco, CA', 'PST (UTC-8)', '')
})

seedIfEmpty('tax_deductions', () => {
  const stmt = db.prepare(`INSERT INTO tax_deductions (category, amount, icon, max, color) VALUES (@category, @amount, @icon, @max, @color)`)
  const rows = [
    { category: 'Home Office', amount: 3600, icon: '🏠', max: 5400, color: '#16a34a' },
    { category: 'Software & Tools', amount: 2840, icon: '💻', max: 5400, color: '#ec4899' },
    { category: 'Health Insurance', amount: 5400, icon: '🏥', max: 5400, color: '#10b981' },
    { category: 'Equipment', amount: 4100, icon: '🖥', max: 5400, color: '#f59e0b' },
    { category: 'Education', amount: 1200, icon: '📚', max: 5400, color: '#06b6d4' },
    { category: 'Internet & Phone', amount: 960, icon: '📡', max: 5400, color: '#78716c' },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('tax_documents', () => {
  const stmt = db.prepare(`INSERT INTO tax_documents (name, status, date, size) VALUES (@name, @status, @date, @size)`)
  const rows = [
    { name: '1099-NEC (Tech Trophey)', status: 'Received', date: 'Jan 5', size: '48 KB' },
    { name: '1099-NEC (Hencewood)', status: 'Received', date: 'Jan 8', size: '52 KB' },
    { name: 'Schedule C Draft', status: 'In Progress', date: 'Jan 12', size: '—' },
    { name: '2023 Tax Return', status: 'Filed', date: 'Apr 12', size: '210 KB' },
    { name: 'W-9 Form', status: 'Filed', date: 'Mar 1', size: '28 KB' },
    { name: 'Estimated Payments', status: 'In Progress', date: 'Jan 14', size: '—' },
  ]
  for (const r of rows) stmt.run(r)
})

seedIfEmpty('activity_log', () => {
  const stmt = db.prepare(`INSERT INTO activity_log (message, createdAt) VALUES (?, ?)`)
  stmt.run('Welcome to LanceFlo — your workspace is ready', new Date().toISOString())
})

export function logActivity(message: string) {
  db.prepare(`INSERT INTO activity_log (message, createdAt) VALUES (?, ?)`).run(message, new Date().toISOString())
}

export default db
