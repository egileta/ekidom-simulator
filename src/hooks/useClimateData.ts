import { useEffect, useRef } from 'react'
import { geocode, fetchClimate } from '../lib/climate'
import { useSimulatorStore } from '../store/simulatorStore'

export function useClimateData(query: string) {
  const setClimate        = useSimulatorStore(s => s.setClimate)
  const setLocation       = useSimulatorStore(s => s.setLocation)
  const setClimateLoading = useSimulatorStore(s => s.setClimateLoading)
  const timerRef          = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>)

  useEffect(() => {
    if (!query.trim()) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setClimateLoading(true)
      try {
        const loc = await geocode(query)
        if (!loc) return
        setLocation(loc)
        const climate = await fetchClimate(loc.lat, loc.lon)
        setClimate(climate)
      } catch {
        // silent fail — user can still adjust sliders manually
      } finally {
        setClimateLoading(false)
      }
    }, 600)

    return () => clearTimeout(timerRef.current)
  }, [query])
}
