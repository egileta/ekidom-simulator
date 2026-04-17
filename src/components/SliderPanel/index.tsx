import { useSimulatorStore } from '../../store/simulatorStore'
import { SLIDER_LIMITS } from '../../lib/constants'
import { T } from '../../lib/theme'
import { SliderGroup } from './SliderGroup'
import { LocationInput } from './LocationInput'
import { EmailCapture } from '../EmailCapture'
import { sendSimulation } from '../../lib/supabase'

const SectionLabel = ({ children }: { children: string }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: T.DOM,
    textTransform: 'uppercase', margin: '22px 0 14px',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    {children}
    <span style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)', display: 'block' }} />
  </div>
)

export function SliderPanel() {
  const s = useSimulatorStore()
  const L = SLIDER_LIMITS
  const fmt2 = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{
      padding: '20px 28px',
      paddingBottom: 'calc(50vh + 60px)',
      background: T.BG_SLIDER,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* ── Instructions ── */}
      <p style={{
        fontSize: 12, color: T.TEXT_MUTED, lineHeight: 1.65,
        margin: '0 0 16px', padding: '10px 13px',
        background: 'rgba(96,165,250,0.04)',
        border: `1px solid ${T.BORDER}`,
        borderRadius: 10,
      }}>
        Introduzca dirección, superficies y consumos.<br />
        Por defecto se muestran valores medios de España.
      </p>

      {/* ── Localidad — moved above sliders ── */}
      <SectionLabel>Localidad</SectionLabel>
      <LocationInput />

      {/* ── Vivienda ── */}
      <SectionLabel>Tu vivienda</SectionLabel>

      <SliderGroup label="Superficie de tejado disponible"
        value={s.roofArea} {...L.roofArea} unit="m²" color="blue"
        onChange={v => s.setField('roofArea', v)} />

      <SliderGroup label="Superficie suelo radiante"
        value={s.floorArea} {...L.floorArea} unit="m²" color="amber"
        disabled={!s.services.suelo}
        onChange={v => s.setField('floorArea', v)} />

      {/* ── Consumo ── */}
      <SectionLabel>Tu consumo energético</SectionLabel>

      <SliderGroup label="Consumo eléctrico anual"
        value={s.electricKwh} {...L.electricKwh} unit="kWh/año" color="blue"
        onChange={v => s.setField('electricKwh', v)} />

      <SliderGroup label="Consumo calefacción / ACS"
        value={s.gasKwh} {...L.gasKwh} unit="kWh/año" color="green"
        disabled={!s.services.aero}
        onChange={v => s.setField('gasKwh', v)} />

      {/* ── Tarifas ── */}
      <SectionLabel>Tus tarifas actuales</SectionLabel>

      <SliderGroup label="Precio electricidad"
        value={s.electricPrice} {...L.electricPrice} unit="€/kWh" color="blue"
        formatValue={fmt2}
        onChange={v => s.setField('electricPrice', v)} />

      <SliderGroup label="Precio gas natural"
        value={s.gasPrice} {...L.gasPrice} unit="€/kWh" color="green"
        disabled={!s.services.aero}
        formatValue={fmt2}
        onChange={v => s.setField('gasPrice', v)} />

      {/* ── Clima ── */}
      <SectionLabel>Datos climáticos</SectionLabel>

      <SliderGroup label="Horas de sol pico (HSP)"
        value={s.climate.hsp} {...L.hsp} unit="h/día" color="blue"
        disabled={!s.services.solar}
        formatValue={v => v.toFixed(1)}
        onChange={v => s.setClimate({ ...s.climate, hsp: v })} />

      <SliderGroup label="Velocidad media del viento"
        value={s.climate.windSpeed} {...L.windSpeed} unit="m/s" color="gray"
        formatValue={v => v.toFixed(1)}
        onChange={v => s.setClimate({ ...s.climate, windSpeed: v })} />

      <SliderGroup label="Temperatura media invierno"
        value={s.climate.winterTemp} {...L.winterTemp} unit="°C" color="green"
        disabled={!s.services.aero}
        formatValue={v => `${v.toFixed(0)}`}
        onChange={v => s.setClimate({ ...s.climate, winterTemp: v })} />

      <EmailCapture
        onSubmit={email => sendSimulation(email, s)}
        onReset={s.reset}
      />
    </div>
  )
}
