import { useAnimatedValue } from '../../hooks/useAnimatedValue'

type SliderColor = 'blue' | 'green' | 'amber' | 'gray'

const THUMB_COLORS: Record<SliderColor, string> = {
  blue:  '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  gray:  '#64748b',
}

const VALUE_COLORS: Record<SliderColor, string> = {
  blue:  '#60a5fa',
  green: '#34d399',
  amber: '#fbbf24',
  gray:  '#94a3b8',
}

interface SliderGroupProps {
  label:    string
  value:    number
  min:      number
  max:      number
  step:     number
  unit:     string
  color:    SliderColor
  disabled?: boolean
  onChange: (v: number) => void
  formatValue?: (v: number) => string
}

export function SliderGroup({
  label, value, min, max, step, unit, color, disabled = false, onChange, formatValue,
}: SliderGroupProps) {
  const animated = useAnimatedValue(value, 1200, false)
  const pct = ((value - min) / (max - min)) * 100

  const display = formatValue
    ? formatValue(animated)
    : animated >= 1000
      ? animated.toLocaleString('es-ES', { maximumFractionDigits: 0 })
      : animated.toLocaleString('es-ES', { maximumFractionDigits: 2 })

  const thumbColor = THUMB_COLORS[color]
  const valColor   = VALUE_COLORS[color]

  return (
    <div style={{
      marginBottom: 22,
      opacity:      disabled ? 0.25 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition:   'opacity 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: valColor }}>
          {display}
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 400, marginLeft: 2 }}>{unit}</span>
        </span>
      </div>

      <style>{`
        .slider-${color}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${thumbColor};
          border: 2px solid ${thumbColor}80;
          box-shadow: 0 0 0 3px ${thumbColor}26;
          cursor: pointer;
        }
        .slider-${color} { cursor: pointer; }
      `}</style>

      <input
        type="range"
        className={`slider-${color}`}
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{
          width: '100%', height: 5, borderRadius: 3,
          outline: 'none', border: 'none', marginBottom: 4,
          background: `linear-gradient(to right, ${thumbColor} ${pct}%, rgba(255,255,255,0.07) ${pct}%)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155' }}>
        <span>{formatValue ? formatValue(min) : min.toLocaleString('es-ES')} {unit}</span>
        <span>{formatValue ? formatValue(max) : max.toLocaleString('es-ES')} {unit}</span>
      </div>
    </div>
  )
}
