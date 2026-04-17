import { useSimulatorStore } from '../../store/simulatorStore'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import { DISPLAY } from '../../lib/constants'

interface ServiceBar { key: 'solar' | 'aero' | 'suelo'; label: string; color: string }
const BARS: ServiceBar[] = [
  { key: 'solar', label: 'Fotovoltaica', color: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
  { key: 'aero',  label: 'Aerotermia',   color: 'linear-gradient(90deg,#10b981,#34d399)' },
  { key: 'suelo', label: 'Suelo rad.',   color: 'linear-gradient(90deg,#f59e0b,#fcd34d)' },
]

export function SavingsCard() {
  const savings  = useSimulatorStore(s => s.results.savings)
  const services = useSimulatorStore(s => s.services)

  const animTotal = useAnimatedValue(savings.total, 600)
  const maxSaving = Math.max(savings.solar, savings.aero, savings.suelo, 1)

  const deltaVsMedia = Math.round(((savings.total - DISPLAY.MEDIA_NACIONAL_AHORRO) / DISPLAY.MEDIA_NACIONAL_AHORRO) * 100)

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(16,185,129,0.05))',
      border: '1px solid rgba(59,130,246,0.2)', borderRadius: 13, padding: '13px 15px',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: 3 }}>
        Ahorro total anual estimado
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
        {Math.round(animTotal).toLocaleString('es-ES')}
        <span style={{ fontSize: 13, color: '#475569', fontWeight: 400 }}> €/año</span>
      </div>
      <div style={{
        display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#34d399',
        borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginTop: 4,
      }}>
        {deltaVsMedia >= 0 ? '↑' : '↓'} {Math.abs(deltaVsMedia)}% vs media nacional
      </div>

      {/* Bars — only active services */}
      <div style={{ marginTop: 10 }}>
        {BARS.map(bar => {
          if (!services[bar.key]) return null
          const val = savings[bar.key]
          const pct = (val / maxSaving) * 100
          return (
            <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#64748b', width: 72, flexShrink: 0 }}>{bar.label}</span>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: bar.color,
                  width: `${pct}%`, transition: 'width 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8', width: 46, textAlign: 'right', flexShrink: 0 }}>
                {Math.round(val).toLocaleString('es-ES')} €
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
