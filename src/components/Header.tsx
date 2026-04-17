import { useState } from 'react'

export function Header() {
  const [logoErr, setLogoErr] = useState(false)

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0a0f1e',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {/* Brand cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!logoErr ? (
            <img
              src="/ekidom-logo.png"
              alt="Ekidom"
              onError={() => setLogoErr(true)}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#C4C232,#60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
            }}>E</div>
          )}
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#C4C232' }}>
            Ekidom
          </span>
        </div>

        {/* Subtitle */}
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: '#475569',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Simulador de ahorro con renovables
        </span>
      </header>

      <style>{`
        @media (max-width: 700px) {
          .header-question {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </>
  )
}
