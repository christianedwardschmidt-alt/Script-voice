export default function ContactPage() {
  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1535', marginBottom: 6 }}>Contact Info</h1>
      <p style={{ color: '#6b6899', fontSize: 14, marginBottom: 24 }}>Your public freelancer profile information</p>
      <div className="card" style={{ padding: 28, maxWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {[
            { label: 'Full Name', placeholder: 'Christian Schmidt', type: 'text' },
            { label: 'Email', placeholder: 'christian@freelance.io', type: 'email' },
            { label: 'Phone', placeholder: '+1 (555) 000-0000', type: 'tel' },
            { label: 'Website', placeholder: 'yoursite.com', type: 'url' },
            { label: 'Location', placeholder: 'San Francisco, CA', type: 'text' },
            { label: 'Timezone', placeholder: 'PST (UTC-8)', type: 'text' },
          ].map(({ label, placeholder, type }) => (
            <div key={label}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1535', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type={type} placeholder={placeholder} className="search-input" style={{ paddingLeft: 12 }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1535', display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea placeholder="Tell clients about yourself..." style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(120,100,200,0.1)', borderRadius: 10, fontSize: 14, color: '#1a1535', resize: 'none', outline: 'none', minHeight: 80, fontFamily: 'inherit', background: 'var(--card)' }} />
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  )
}
