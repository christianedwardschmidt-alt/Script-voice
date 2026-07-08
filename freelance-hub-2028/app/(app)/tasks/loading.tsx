const SKELs = [
  { w: '75%' }, { w: '90%' }, { w: '65%' },
  { w: '80%' }, { w: '70%' }, { w: '85%' },
]

export default function TasksLoading() {
  return (
    <div style={{ padding: '28px 28px', background: '#f2f4f8', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ width: 80, height: 26, borderRadius: 6, background: '#b8bfcc', marginBottom: 8 }} />
          <div style={{ width: 200, height: 14, borderRadius: 4, background: '#c8cdd8' }} />
        </div>
        <div style={{ width: 96, height: 34, borderRadius: 8, background: '#b8bfcc' }} />
      </div>

      <div style={{ width: 60, height: 22, borderRadius: 4, background: '#b8bfcc', marginBottom: 16 }} />

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Task list */}
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 38, borderRadius: 8, background: '#edf0f5' }} />
            <div style={{ width: 80, height: 38, borderRadius: 8, background: '#edf0f5' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['All', 'To Do', 'In Progress', 'Completed'].map(t => (
              <div key={t} style={{ width: 60, height: 28, borderRadius: 8, background: '#c8cdd8' }} />
            ))}
          </div>

          <div style={{ background: '#edf0f5', borderRadius: 12, overflow: 'hidden' }}>
            {SKELs.map(({ w }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 20px',
                borderBottom: i < SKELs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                background: '#edf0f5',
              }}>
                <div style={{ width: 16, height: 16, marginTop: 3, flexShrink: 0, borderRadius: 4, background: '#b8bfcc' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: w, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 8 }} />
                  <div style={{ width: '50%', height: 12, borderRadius: 4, background: '#c8cdd8', marginBottom: 10 }} />
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
          <div style={{ background: '#edf0f5', borderRadius: 12, padding: 20 }}>
            <div style={{ width: 140, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 16 }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div>
                  <div style={{ width: 110, height: 12, borderRadius: 4, background: '#b8bfcc', marginBottom: 6 }} />
                  <div style={{ width: 70, height: 10, borderRadius: 4, background: '#c8cdd8' }} />
                </div>
                <div style={{ width: 44, height: 18, borderRadius: 99, background: '#b8bfcc' }} />
              </div>
            ))}
          </div>
          <div style={{ background: '#edf0f5', borderRadius: 12, padding: 20 }}>
            <div style={{ width: 110, height: 14, borderRadius: 4, background: '#b8bfcc', marginBottom: 14 }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div>
                  <div style={{ width: 90, height: 12, borderRadius: 4, background: '#b8bfcc', marginBottom: 6 }} />
                  <div style={{ width: 60, height: 10, borderRadius: 4, background: '#c8cdd8' }} />
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
