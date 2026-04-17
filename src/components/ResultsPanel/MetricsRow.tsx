import { useSimulatorStore } from '../../store/simulatorStore'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'

export function MetricsRow() {
  const budget       = useSimulatorStore(s => s.results.budget)
  const paybackYears = useSimulatorStore(s => s.results.paybackYears)

  const animBudget  = useAnimatedValue(budget, 600)
  const animPayback = useAnimatedValue(paybackYears, 600)

  const paybackDisplay = isFinite(animPayback) ? animPayback.toFixed(1) : '∞'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#34d399', textTransform: 'uppercase', marginBottom: 3 }}>
          Amortización
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#6ee7b7', lineHeight: 1 }}>
          {paybackDisplay}<span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> años</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>Después: ahorro puro</div>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 3 }}>
          Presupuesto
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
          {Math.round(animBudget).toLocaleString('es-ES')}
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> €</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>Con subvenciones (~30%)</div>
      </div>
    </div>
  )
}
