import type { ClimateData, Location } from '../types'

// Nominatim: free geocoding — max 1 req/s (debounce 600ms in hook)
export async function geocode(query: string): Promise<Location | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  return { label: data[0].display_name, lat: +data[0].lat, lon: +data[0].lon }
}

// Open-Meteo: free climate data — no API key required
export async function fetchClimate(lat: number, lon: number): Promise<ClimateData> {
  const params = new URLSearchParams({
    latitude:  String(lat),
    longitude: String(lon),
    daily: [
      'shortwave_radiation_sum',
      'wind_speed_10m_max',
      'temperature_2m_min',
    ].join(','),
    timezone: 'auto',
    past_days: '365',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('Climate fetch failed')
  const data = await res.json()

  const daily = data.daily as {
    time: string[]
    shortwave_radiation_sum: number[]
    wind_speed_10m_max: number[]
    temperature_2m_min: number[]
  }

  // HSP: mean daily kWh/m² across the year
  const hsp = avg(daily.shortwave_radiation_sum)

  // Wind: mean annual max wind speed
  const windSpeed = avg(daily.wind_speed_10m_max)

  // Winter temp: mean of Dec-Feb min temps
  const winterTemps = daily.time
    .map((d, i) => ({ month: new Date(d).getMonth(), temp: daily.temperature_2m_min[i] }))
    .filter(({ month }) => month === 11 || month === 0 || month === 1)
    .map(({ temp }) => temp)
  const winterTemp = winterTemps.length ? avg(winterTemps) : 8

  return {
    hsp:        +hsp.toFixed(1),
    windSpeed:  +windSpeed.toFixed(1),
    winterTemp: +winterTemp.toFixed(1),
  }
}

function avg(arr: number[]): number {
  const valid = arr.filter(v => v != null && !isNaN(v))
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
}
