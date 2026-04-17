export function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#0a0f1e',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '13px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.5 }}>
        <span style={{ color: '#f59e0b' }}>Eki</span>
        <span style={{ color: '#60a5fa' }}>dom</span>
        <span style={{ fontSize: 12, fontWeight: 400, color: '#475569', marginLeft: 10 }}>
          Simulador de ahorro energético
        </span>
      </div>
      <a
        href="https://ekidom.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}
      >
        ekidom.com
      </a>
    </header>
  )
}
