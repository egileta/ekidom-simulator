import { createClient } from '@supabase/supabase-js'
import type { SimulatorState } from '../store/simulatorStore'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

export { supabase }

export async function sendSimulation(email: string, state: SimulatorState): Promise<void> {
  const { results, services, climate, location } = state

  // 1. Generate PDF in browser
  const { generatePDF } = await import('./pdf')
  const pdfBlob = await generatePDF({ email, state })
  const pdfBase64 = await blobToBase64(pdfBlob)

  // 2. Call Edge Function (saves to DB + sends email)
  const { data, error } = await supabase.functions.invoke('send-simulation', {
    body: {
      email,
      inputs: {
        roof_area:      state.roofArea,
        floor_area:     state.floorArea,
        electric_kwh:   state.electricKwh,
        gas_kwh:        state.gasKwh,
        electric_price: state.electricPrice,
        gas_price:      state.gasPrice,
        hsp:            climate.hsp,
        wind_speed:     climate.windSpeed,
        winter_temp:    climate.winterTemp,
        service_solar:  services.solar,
        service_aero:   services.aero,
        service_suelo:  services.suelo,
        location_label: location?.label ?? null,
        location_lat:   location?.lat   ?? null,
        location_lon:   location?.lon   ?? null,
      },
      results: {
        saving_total:  results.savings.total,
        saving_solar:  results.savings.solar,
        saving_aero:   results.savings.aero,
        saving_suelo:  results.savings.suelo,
        budget_total:  results.budget,
        payback_years: results.paybackYears,
      },
      pdfBase64,
    },
  })

  if (error) throw new Error(error.message)
  if (data && !data.success) throw new Error(data.error ?? 'Error desconocido')
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
