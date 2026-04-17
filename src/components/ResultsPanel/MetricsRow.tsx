import { useSimulatorStore } from '../../store/simulatorStore'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import { FINANCE } from '../../lib/constants'

export function MetricsRow() {
  const budget         = useSimulatorStore(s => s.results.budget)
  const paybackYears   = useSimulatorStore(s => s.results.paybackYears)
  const subsidyEnabled = useSimulatorStore(s => s.subsidyEnabled)
  const toggleSubsidy  = useSimulatorStore(s => s.toggleSubsidy)

  const animBudget  = useAnimatedValue(budget, 600)
  const animPayback = useAnimatedValue(paybackYears, 600)

  const paybackDisplay = isFinite(animPayback) ? animPayback.toFixed(1) : '∞'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {/* Amortización — orange tones */}
      <div style={{
        background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 3 }}>
          Amortización
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
          {paybackDisplay}<span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> años</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>Después: ahorro puro</div>
      </div>

      {/* Presupuesto — blue tones */}
      <div style={{
        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        {/* Header row with subsidy toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#60a5fa', textTransform: 'uppercase' }}>
            Presupuesto
          </div>
          {/* Subsidy toggle */}
          <div
            onClick={toggleSubsidy}
            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }}
            title={subsidyEnabled ? 'Desactivar subvención' : 'Activar subvención'}
          >
            <span style={{ fontSize: 9, color: subsidyEnabled ? '#93c5fd' : '#475569', fontWeight: 600 }}>
              -{Math.round(FINANCE.SUBSIDY_RATE * 100)}%
            </span>
            <div style={{
              width: 28, height: 16, borderRadius: 8, position: 'relative', flexShrink: 0,
              background: subsidyEnabled ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.10)',
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: subsidyEnabled ? 14 : 2,
                width: 12, height: 12, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: '#93c5fd', lineHeight: 1 }}>
          {Math.round(animBudget).toLocaleString('es-ES')}
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> €</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>
          {subsidyEnabled ? `Con subvenciones (~${Math.round(FINANCE.SUBSIDY_RATE * 100)}%)` : 'Sin subvenciones'}
        </div>
      </div>
    </div>
  )
}
