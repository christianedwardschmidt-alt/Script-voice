export default function SettingsPage() {
  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1535', marginBottom: 6 }}>Settings</h1>
      <p style={{ color: '#6b6899', fontSize: 14, marginBottom: 24 }}>Configure your account preferences</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        {[
          { title: 'Notifications', desc: 'Email and push notification preferences', toggle: true, on: true },
          { title: 'Two-Factor Auth', desc: 'Add an extra layer of security', toggle: true, on: false },
          { title: 'Dark Mode', desc: 'Switch between light and dark theme', toggle: true, on: false },
          { title: 'Invoice Auto-send', desc: 'Automatically send invoices on due date', toggle: true, on: true },
          { title: 'Weekly Digest', desc: 'Receive a weekly summary of your activity', toggle: true, on: true },
        ].map((item, i) => (
          <div key={i} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1535' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#6b6899', marginTop: 2 }}>{item.desc}</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: item.on ? '#7c3aed' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.15s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', position: 'absolute', top: 3, left: item.on ? 23 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Danger Zone</div>
          <div style={{ fontSize: 12, color: '#6b6899', marginBottom: 12 }}>These actions are irreversible. Please proceed with caution.</div>
          <button style={{ padding: '8px 16px', border: '1px solid #fecaca', borderRadius: 8, background: 'var(--card)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>Delete Account</button>
        </div>
      </div>
    </div>
  )
}
