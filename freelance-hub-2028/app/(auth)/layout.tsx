export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f2f4f8 0%, #e8f5ee 50%, #f2f4f8 100%)',
      padding: 24,
    }}>
      {children}
    </div>
  )
}
