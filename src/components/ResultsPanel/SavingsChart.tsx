import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useSimulatorStore } from '../../store/simulatorStore'
import { buildProjection } from '../../lib/calculations'

const HORIZONS = [5, 10, 20, 25] as const
type Horizon = typeof HORIZONS[number]

const LINE_CONFIG = [
  { key: 'total', color: '#a78bfa', label: 'Total',       width: 2.5 },
  { key: 'solar', color: '#60a5fa', label: 'Solar',       width: 1.8 },
  { key: 'aero',  color: '#34d399', label: 'Aerotermia',  width: 1.8 },
  { key: 'suelo', color: '#fbbf24', label: 'Suelo rad.',  width: 1.8 },
] as const

const fmt = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k €` : `${v} €`

interface TooltipPayload {
  name: string; value: number; color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: TooltipPayload[]; label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 9, padding: '8px 12px', fontSize: 11,
    }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>Año {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: p.color }}>
            {Math.round(p.value).toLocaleString('es-ES')} €
          </span>
        </div>
      ))}
    </div>
  )
}

export function SavingsChart() {
  const [horizon, setHorizon] = useState<Horizon>(10)
  const savings  = useSimulatorStore(s => s.results.savings)
  const payback  = useSimulatorStore(s => s.results.paybackYears)
  const services = useSimulatorStore(s => s.services)

  const data = useMemo(
    () => buildProjection(savings, horizon),
    [savings, horizon]
  )

  const amortYear = isFinite(payback) ? payback : null

  return (
    <div style={{
      background: '#0d1425', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 13, padding: '14px 14px 10px',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#60a5fa', textTransform: 'uppercase' }}>
          Ahorro acumulado proyectado
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: 2 }}>
          {HORIZONS.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: horizon === h ? 600 : 400,
                background: horizon === h ? '#1e293b' : 'transparent',
                color: horizon === h ? '#e2e8f0' : '#475569',
              }}
            >
              {h}a
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="0" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#334155', fontSize: 9 }}
            tickLine={false} axisLine={false}
            tickFormatter={v => v === 0 ? 'Hoy' : `Año ${v}`}
          />
          <YAxis
            tick={{ fill: '#334155', fontSize: 9 }}
            tickLine={false} axisLine={false}
            tickFormatter={fmt}
          />
          <Tooltip content={<CustomTooltip />} />

          {amortYear && amortYear <= horizon && (
            <ReferenceLine
              x={Math.round(amortYear)}
              stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.2}
              label={{ value: `Amort. ${amortYear.toFixed(1)}a`, fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
            />
          )}

          {LINE_CONFIG.map(cfg => {
            // Hide individual service lines if service is off; always show total
            if (cfg.key !== 'total' && !services[cfg.key as keyof typeof services]) return null
            return (
              <Line
                key={cfg.key}
                type="monotone"
                dataKey={cfg.key}
                name={cfg.label}
                stroke={cfg.color}
                strokeWidth={cfg.width}
                dot={false}
                activeDot={{ r: 4, fill: cfg.color }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        {LINE_CONFIG.map(cfg => {
          const isServiceLine = cfg.key !== 'total'
          const active = !isServiceLine || services[cfg.key as keyof typeof services]
          return (
            <div key={cfg.key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: '#64748b',
              opacity: active ? 1 : 0.3,
              textDecoration: active ? 'none' : 'line-through',
              transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
              {cfg.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
