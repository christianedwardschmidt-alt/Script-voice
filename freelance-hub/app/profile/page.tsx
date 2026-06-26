export default function ProfilePage() {
  return (
    <div style={{ padding: '28px 28px', background: '#f8f7fc', minHeight: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Profile</h1>
      <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Manage your personal profile</p>
      <div className="card" style={{ padding: 28, maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700 }}>C</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Christian Schmidt</div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>christian@freelance.io</div>
            <button style={{ marginTop: 8, padding: '5px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Change Photo</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Display Name', value: 'Christian Schmidt' },
            { label: 'Headline', value: 'Full Stack Developer & UI Designer' },
            { label: 'Skills', value: 'React, TypeScript, Figma, Next.js' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
              <input defaultValue={value} className="search-input" style={{ paddingLeft: 12 }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary">Update Profile</button>
        </div>
      </div>
    </div>
  )
}
