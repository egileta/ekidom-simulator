import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { SimulatorState } from '../store/simulatorStore'

const colors = {
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  green:  '#10b981',
  text:   '#1e293b',
  muted:  '#64748b',
  solar:  '#3b82f6',
  aero:   '#10b981',
  suelo:  '#f59e0b',
}

const s = StyleSheet.create({
  page:      { padding: 40, backgroundColor: '#f8fafc', fontFamily: 'Helvetica' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoText:  { fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.amber },
  logoBlue:  { color: colors.blue },
  url:       { fontSize: 10, color: colors.muted },
  title:     { fontSize: 13, color: colors.muted, marginBottom: 2 },
  bigNum:    { fontSize: 36, fontFamily: 'Helvetica-Bold', color: colors.text },
  bigUnit:   { fontSize: 14, color: colors.muted },
  section:   { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.blue, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  row2col:   { flexDirection: 'row', gap: 12 },
  col:       { flex: 1 },
  barRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
  barLabel:  { fontSize: 9, color: colors.muted, width: 70 },
  barTrack:  { flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3 },
  barFill:   { height: 5, borderRadius: 3 },
  barAmt:    { fontSize: 9, color: colors.text, width: 50, textAlign: 'right' },
  divider:   { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  footer:    { marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: colors.muted },
  ctaBox:    { backgroundColor: colors.amber, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginTop: 16 },
  ctaText:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white', textAlign: 'center' },
})

interface PDFProps {
  email: string
  state: SimulatorState
}

function EkidomPDF({ email, state }: PDFProps) {
  const { results, services } = state
  const { savings, budget, paybackYears } = results
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const location = state.location?.label.split(',').slice(0, 2).join(',') ?? 'Sin ubicación'

  const maxSaving = Math.max(savings.solar, savings.aero, savings.suelo, 1)

  const serviceRows = [
    { key: 'solar' as const, label: 'Placas solares',  color: colors.solar, saving: savings.solar },
    { key: 'aero'  as const, label: 'Aerotermia',      color: colors.aero,  saving: savings.aero  },
    { key: 'suelo' as const, label: 'Suelo radiante',  color: colors.suelo, saving: savings.suelo },
  ].filter(r => services[r.key])

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logoText}>Eki<Text style={s.logoBlue}>dom</Text></Text>
            <Text style={s.title}>Simulación de ahorro energético</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.url}>ekidom.com</Text>
            <Text style={s.footerText}>{location}</Text>
            <Text style={s.footerText}>{today}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Main saving */}
        <View style={[s.section, { alignItems: 'center', paddingVertical: 8 }]}>
          <Text style={s.sectionTitle}>Ahorro estimado total</Text>
          <Text style={s.bigNum}>
            {Math.round(savings.total).toLocaleString('es-ES')}
            <Text style={s.bigUnit}> €/año</Text>
          </Text>

          {/* Total bar */}
          <View style={[s.barTrack, { marginTop: 10, height: 8, width: '100%' }]}>
            <View style={[s.barFill, { backgroundColor: '#a78bfa', width: '100%', height: 8 }]} />
          </View>
        </View>

        <View style={s.divider} />

        {/* Per-service rows */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Desglose por servicio</Text>
          {serviceRows.map(r => (
            <View key={r.key} style={s.barRow}>
              <Text style={s.barLabel}>{r.label}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, {
                  backgroundColor: r.color,
                  width: `${(r.saving / maxSaving) * 100}%`,
                }]} />
              </View>
              <Text style={s.barAmt}>{Math.round(r.saving).toLocaleString('es-ES')} €/año</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        {/* Data + metrics */}
        <View style={[s.row2col, s.section]}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Tu vivienda</Text>
            <Text style={s.footerText}>Tejado: {state.roofArea} m²</Text>
            <Text style={s.footerText}>Suelo radiante: {state.floorArea} m²</Text>
            <Text style={s.footerText}>Ubicación: {location}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Tu consumo</Text>
            <Text style={s.footerText}>Eléctrico: {state.electricKwh.toLocaleString('es-ES')} kWh/año</Text>
            <Text style={s.footerText}>Gas/ACS: {state.gasKwh.toLocaleString('es-ES')} kWh/año</Text>
            <Text style={s.footerText}>Precio luz: {state.electricPrice.toFixed(2)} €/kWh</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Budget + payback */}
        <View style={[s.row2col, s.section]}>
          <View style={[s.col, { backgroundColor: '#fef9f0', borderRadius: 8, padding: 12 }]}>
            <Text style={[s.sectionTitle, { color: colors.amber }]}>Presupuesto instalación</Text>
            <Text style={[s.bigNum, { fontSize: 24 }]}>
              {Math.round(budget).toLocaleString('es-ES')} €
            </Text>
            <Text style={s.footerText}>Subvenciones IDAE aplicadas (~30%)</Text>
          </View>
          <View style={[s.col, { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12 }]}>
            <Text style={[s.sectionTitle, { color: colors.green }]}>Amortización</Text>
            <Text style={[s.bigNum, { fontSize: 24 }]}>
              {isFinite(paybackYears) ? paybackYears.toFixed(1) : '∞'} años
            </Text>
            <Text style={s.footerText}>Después del retorno: ahorro puro</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={s.ctaBox}>
          <Text style={s.ctaText}>¿Quieres confirmar este presupuesto? Contacta con Ekidom</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Simulación generada para {email}</Text>
          <Text style={s.footerText}>info@ekidom.com · ekidom.com</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generatePDF(props: PDFProps): Promise<Blob> {
  return (pdf(<EkidomPDF {...props} />) as any).toBlob()
}
