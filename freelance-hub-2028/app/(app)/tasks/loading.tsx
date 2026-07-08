const WIDTHS = [75, 90, 65, 80, 70, 85]

export default function TasksLoading() {
  return (
    <div className="page-pad" style={{ padding: '28px 28px', background: '#f2f4f8', minHeight: '100dvh' }}>
      {/* Header */}
      <div className="page-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ width: 72, height: 26, borderRadius: 6, background: '#c8cdd8', marginBottom: 8 }} />
          <div style={{ width: 220, height: 14, borderRadius: 4, background: '#d5d9e2' }} />
        </div>
        <div style={{ width: 100, height: 36, borderRadius: 9, background: '#c8cdd8' }} />
      </div>

      {/* Count */}
      <div style={{ width: 80, height: 22, borderRadius: 4, background: '#c8cdd8', marginBottom: 16 }} />

      {/* Grid — uses same class as page.tsx so mobile collapse works identically */}
      <div className="g-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Task list */}
        <div>
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 38, borderRadius: 9, background: '#e0e4ed' }} />
            <div style={{ width: 80, height: 38, borderRadius: 9, background: '#e0e4ed' }} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[50, 52, 82, 88].map((w, i) => (
              <div key={i} style={{ width: w, height: 30, borderRadius: 8, background: '#c8cdd8' }} />
            ))}
          </div>

          {/* Task rows */}
          <div style={{ background: '#edf0f5', borderRadius: 14, overflow: 'hidden' }}>
            {WIDTHS.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 20px',
                borderBottom: i < WIDTHS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}>
                <div style={{ width: 16, height: 16, marginTop: 3, flexShrink: 0, borderRadius: 4, background: '#b8bfcc' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: `${w}%`, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 8 }} />
                  <div style={{ width: `${40 + (i % 2) * 20}%`, height: 12, borderRadius: 4, background: '#c8cdd8', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 56, height: 20, borderRadius: 99, background: '#b8bfcc' }} />
                    <div style={{ width: 72, height: 20, borderRadius: 99, background: '#c8cdd8' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Deadlines card */}
          <div style={{ background: '#edf0f5', borderRadius: 14, padding: 20 }}>
            <div style={{ width: 140, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 16 }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                  <div style={{ width: '70%', height: 12, borderRadius: 4, background: '#b8bfcc', marginBottom: 6 }} />
                  <div style={{ width: '40%', height: 10, borderRadius: 4, background: '#c8cdd8' }} />
                </div>
                <div style={{ width: 44, height: 18, borderRadius: 99, background: '#b8bfcc' }} />
              </div>
            ))}
          </div>

          {/* Projects card */}
          <div style={{ background: '#edf0f5', borderRadius: 14, padding: 20 }}>
            <div style={{ width: 110, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 14 }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 12, borderRadius: 4, background: '#b8bfcc', marginBottom: 6 }} />
                  <div style={{ width: '35%', height: 10, borderRadius: 4, background: '#c8cdd8' }} />
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b8bfcc' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
