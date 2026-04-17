import { useState, useRef } from 'react'
import { ServiceToggles } from './ServiceToggles'
import { SavingsCard } from './SavingsCard'
import { MetricsRow } from './MetricsRow'
import { SavingsChart } from './SavingsChart'

function getSnapPoints(): number[] {
  return [100, 220, Math.round(window.innerHeight * 0.50), Math.round(window.innerHeight * 0.85)]
}

function snapTo(h: number): number {
  const pts = getSnapPoints()
  return pts.reduce((best, pt) => Math.abs(pt - h) < Math.abs(best - h) ? pt : best)
}

export function ResultsPanel() {
  const [panelHeight, setPanelHeight] = useState(220)
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

  const showExpanded = panelHeight > 300

  return (
    <>
      {/* ── Desktop: sticky right column ── */}
      <div className="results-desktop" style={{
        position: 'sticky', top: 50,
        height: 'calc(100vh - 50px)',
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
          height: panelHeight,
          background: '#080d1a',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px 20px 0 0',
          zIndex: 90,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          overflowY: 'auto',
          padding: '10px 16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
          transition: isDragging ? 'none' : 'height 0.35s ease',
        }}
      >
        {/* Draggable handle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onHandleClick}
          style={{
            textAlign: 'center',
            cursor: 'grab',
            paddingBottom: 2,
            touchAction: 'none',
          }}
        >
          <div style={{
            width: 36, height: 4,
            background: isDragging ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.18)',
            borderRadius: 2, margin: '0 auto 8px',
            transition: 'background 0.2s',
          }} />
        </div>

        <ServiceToggles />
        <SavingsCard />

        {/* Always mounted — avoids Recharts ResponsiveContainer 0-width bug */}
        <div style={{
          maxHeight: showExpanded ? 800 : 0,
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'max-height 0.3s ease',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <MetricsRow />
          <SavingsChart />
        </div>
      </div>

      <style>{`
        @media (min-width: 701px) { .results-mobile { display: none !important; } }
        @media (max-width: 700px) { .results-desktop { display: none !important; } }
      `}</style>
    </>
  )
}
