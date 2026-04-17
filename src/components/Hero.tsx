export function Hero() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 24px 28px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.10) 0%, transparent 65%)',
    }}>
      <h1 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 900, lineHeight: 1.2, margin: '0 0 10px',
      }}>
        ¿Cuánto puedes ahorrar<br />
        con{' '}
        <span style={{ color: '#f59e0b' }}>energía renovable</span>?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
        Ajusta los valores de tu vivienda · los resultados se actualizan en tiempo real
      </p>
    </div>
  )
}
