import type { SimulatorState } from '../store/simulatorStore'

export async function sendSimulation(email: string, state: SimulatorState): Promise<void> {
  const { results, services, climate, location } = state

  const { generatePDF } = await import('./pdf')
  const pdfBlob = await generatePDF({ email, state })
  const pdfBase64 = await blobToBase64(pdfBlob)

  const res = await fetch('/api/send-simulation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    }),
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Error desconocido')
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
