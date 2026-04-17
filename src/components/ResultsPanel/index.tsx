import { useState } from 'react'
import { ServiceToggles } from './ServiceToggles'
import { SavingsCard } from './SavingsCard'
import { MetricsRow } from './MetricsRow'
import { SavingsChart } from './SavingsChart'

export function ResultsPanel() {
  const [mobileExpanded, setMobileExpanded] = useState(false)

  return (
    <>
      {/* ── Desktop: sticky right column ── */}
      <div className="results-desktop" style={{
        position: 'sticky', top: 57,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto',
        background: '#080d1a',
        padding: '22px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <ServiceToggles />
        <SavingsCard />
        <MetricsRow />
        <SavingsChart />
        <button
          style={{
            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            border: 'none', borderRadius: 10, padding: 13,
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', width: '100%',
          }}
          onClick={() => document.querySelector<HTMLInputElement>('input[type=email]')?.focus()}
        >
          Solicitar presupuesto real →
        </button>
      </div>

      {/* ── Mobile: fixed bottom panel ── */}
      <div
        className="results-mobile"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: mobileExpanded ? '70vh' : '200px',
          background: '#080d1a',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px 20px 0 0',
          zIndex: 90,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          overflowY: 'auto',
          padding: '10px 16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
          transition: 'height 0.35s ease',
        }}
      >
        {/* Handle */}
        <div
          onClick={() => setMobileExpanded(e => !e)}
          style={{ textAlign: 'center', cursor: 'pointer', paddingBottom: 2 }}
        >
          <div style={{
            width: 36, height: 4, background: 'rgba(255,255,255,0.18)',
            borderRadius: 2, margin: '0 auto 8px',
          }} />
        </div>

        <ServiceToggles />
        <SavingsCard />
        {mobileExpanded && (
          <>
            <MetricsRow />
            <SavingsChart />
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 701px) { .results-mobile { display: none !important; } }
        @media (max-width: 700px) { .results-desktop { display: none !important; } }
      `}</style>
    </>
  )
}
