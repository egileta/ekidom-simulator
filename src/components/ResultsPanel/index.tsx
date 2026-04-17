import { useState, useRef } from 'react'
import { ServiceToggles } from './ServiceToggles'
import { SavingsCard } from './SavingsCard'
import { MetricsRow } from './MetricsRow'
import { SavingsChart } from './SavingsChart'
import { useSimulatorStore } from '../../store/simulatorStore'
import { T } from '../../lib/theme'

function getSnapPoints(): number[] {
  return [100, 220, Math.round(window.innerHeight * 0.50), Math.round(window.innerHeight * 0.85)]
}

function snapTo(h: number): number {
  const pts = getSnapPoints()
  return pts.reduce((best, pt) => Math.abs(pt - h) < Math.abs(best - h) ? pt : best)
}

function focusEmailInput() {
  const el = document.getElementById('email-input') as HTMLInputElement | null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => el.focus(), 300)
}

export function ResultsPanel() {
  const reset = useSimulatorStore(s => s.reset)
  const [panelHeight, setPanelHeight] = useState(() => Math.round(window.innerHeight * 0.50))
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<{ startY: number; startH: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    dragState.current = { startY: e.touches[0].clientY, startH: panelHeight }
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current) return
    const dy = e.touches[0].clientY - dragState.current.startY
    const newH = Math.max(80, Math.min(Math.round(window.innerHeight * 0.92), dragState.current.startH - dy))
    setPanelHeight(newH)
  }

  const onTouchEnd = () => {
    setPanelHeight(h => snapTo(h))
    setIsDragging(false)
    dragState.current = null
  }

  const onHandleClick = () => {
    const pts = getSnapPoints()
    setPanelHeight(h => h >= pts[2] ? pts[1] : pts[2])
  }

  const buttonRow = (compact?: boolean) => (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <button
        onClick={reset}
        style={{
          flex: '0 0 calc(33% - 4px)',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${T.BORDER}`,
          borderRadius: 10, padding: compact ? '10px 0' : '12px 0',
          color: T.TEXT_MUTED, fontSize: compact ? 11 : 12, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ↺ Reiniciar
      </button>
      <button
        style={{
          flex: 1,
          background: T.GRAD_CTA,
          border: 'none', borderRadius: 10, padding: compact ? '10px 14px' : '12px 14px',
          color: 'white', fontSize: compact ? 12 : 13, fontWeight: 700,
          cursor: 'pointer',
        }}
        onClick={focusEmailInput}
      >
        Solicitar presupuesto →
      </button>
    </div>
  )

  return (
    <>
      {/* ── Desktop: sticky right column ── */}
      <div className="results-desktop" style={{
        position: 'sticky', top: 50,
        height: 'calc(100vh - 50px)',
        overflowY: 'auto',
        background: T.BG_RESULTS,
        padding: '22px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <ServiceToggles />
        <SavingsCard />
        <MetricsRow />
        <SavingsChart />
        {buttonRow()}
      </div>

      {/* ── Mobile: fixed bottom panel ── */}
      <div
        className="results-mobile"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: panelHeight,
          background: T.BG_RESULTS,
          borderTop: `1px solid ${T.BORDER_SOFT}`,
          borderRadius: '20px 20px 0 0',
          zIndex: 90,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'height 0.35s ease',
        }}
      >
        {/* Handle — FIXED: outside the scroll area */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onHandleClick}
          style={{
            flexShrink: 0,
            padding: '10px 16px 6px',
            textAlign: 'center',
            cursor: 'grab',
            touchAction: 'none',
            background: T.BG_RESULTS,
            borderRadius: '20px 20px 0 0',
          }}
        >
          <div style={{
            width: 36, height: 4,
            background: isDragging ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
            borderRadius: 2, margin: '0 auto',
            transition: 'background 0.15s',
          }} />
        </div>

        {/* Button row — FIXED: outside the scroll area */}
        <div style={{ flexShrink: 0, padding: '0 16px 8px' }}>
          {buttonRow(true)}
        </div>

        {/* Scrollable content — always fully rendered so chart mounts with correct width */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 16px 24px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <ServiceToggles />
          <SavingsCard />
          <MetricsRow />
          <SavingsChart />
        </div>
      </div>

      <style>{`
        @media (min-width: 701px) { .results-mobile { display: none !important; } }
        @media (max-width: 700px)  { .results-desktop { display: none !important; } }
      `}</style>
    </>
  )
}
