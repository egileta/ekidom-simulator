import { useSimulatorStore } from '../../store/simulatorStore'
import { T } from '../../lib/theme'

interface ServiceConfig {
  key:    'solar' | 'aero' | 'suelo'
  icon:   string
  label:  string
  onColor: string
  textColor: string
  bgColor: string
  borderColor: string
}

const SERVICES: ServiceConfig[] = [
  {
    key: 'solar', icon: '☀️', label: 'Placas solares',
    onColor: T.SOLAR, textColor: T.SOLAR_LIGHT,
    bgColor: T.SOLAR_BG, borderColor: T.SOLAR_BORDER,
  },
  {
    key: 'aero', icon: '🌡️', label: 'Aerotermia',
    onColor: T.AERO, textColor: T.AERO_LIGHT,
    bgColor: T.AERO_BG, borderColor: T.AERO_BORDER,
  },
  {
    key: 'suelo', icon: '🏠', label: 'Suelo radiante',
    onColor: T.SUELO, textColor: T.SUELO_LIGHT,
    bgColor: T.SUELO_BG, borderColor: T.SUELO_BORDER,
  },
]

export function ServiceToggles() {
  const services      = useSimulatorStore(s => s.services)
  const toggleService = useSimulatorStore(s => s.toggleService)
  const savings       = useSimulatorStore(s => s.results.savings)

  return (
    <>
      {/* ── Desktop: 3 cards in one row ── */}
      <div className="desktop-toggles">
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: T.DOM,
          textTransform: 'uppercase', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Active tipo de instalaciones
          <span style={{ flex: 1, height: 1, background: T.BORDER_INFO, display: 'block' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {SERVICES.map(svc => {
            const active = services[svc.key]
            const saving = savings[svc.key]
            return (
              <div
                key={svc.key}
                onClick={() => toggleService(svc.key)}
                style={{
                  flex: 1, padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${active ? svc.borderColor : T.BORDER}`,
                  background: active ? svc.bgColor : 'rgba(255,255,255,0.02)',
                  opacity: active ? 1 : 0.45,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 15 }}>{svc.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{svc.label}</span>
                  </div>
                  {/* pill switch */}
                  <div style={{
                    width: 30, height: 17, borderRadius: 9, position: 'relative', flexShrink: 0,
                    background: active ? svc.onColor : 'rgba(255,255,255,0.10)',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2.5,
                      left: active ? 15 : 2.5,
                      width: 12, height: 12, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: 9, color: active ? svc.textColor : T.TEXT_MUTED }}>
                  {active ? `Ahorro estimado ${Math.round(saving).toLocaleString('es-ES')} €/año` : 'desactivado'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Mobile: 3 chips in one row ── */}
      <div className="mobile-toggles">
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: T.DOM,
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          Active tipo de instalaciones
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {SERVICES.map(svc => {
            const active = services[svc.key]
            return (
              <div
                key={svc.key}
                onClick={() => toggleService(svc.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${active ? svc.borderColor : T.BORDER_SOFT}`,
                  background: active ? svc.bgColor : 'rgba(255,255,255,0.03)',
                  opacity: active ? 1 : 0.45, transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 16 }}>{svc.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: svc.textColor, textAlign: 'center', lineHeight: 1.2 }}>{svc.label}</span>
                <span style={{ fontSize: 9, color: active ? T.AERO_LIGHT : T.TEXT_DIM }}>
                  {active ? '✓ activo' : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 701px) { .mobile-toggles { display: none !important; } }
        @media (max-width: 700px) { .desktop-toggles { display: none !important; } }
      `}</style>
    </>
  )
}
