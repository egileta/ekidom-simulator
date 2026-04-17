import { useState } from 'react'
import { useClimateData } from '../../hooks/useClimateData'
import { useSimulatorStore } from '../../store/simulatorStore'

export function LocationInput() {
  const [query, setQuery]   = useState('Bilbao 48005')
  const location            = useSimulatorStore(s => s.location)
  const climateLoading      = useSimulatorStore(s => s.climateLoading)

  useClimateData(query)

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 15, pointerEvents: 'none',
        }}>📍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Código postal, ciudad o dirección…"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '10px 36px 10px 36px',
            color: '#e2e8f0', fontSize: 13, outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12,
            }}
          >✕</button>
        )}
      </div>

      {climateLoading && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#60a5fa' }}>
          ⟳ Cargando datos climáticos…
        </div>
      )}

      {location && !climateLoading && (
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#93c5fd',
        }}>
          ✅ Datos cargados —{' '}
          {location.label.split(',').slice(0, 2).join(',')}
        </div>
      )}
    </div>
  )
}
