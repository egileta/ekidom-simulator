import { create } from 'zustand'
import { DEFAULTS } from '../lib/constants'
import { calcAllSavings, calcBudget, calcPayback } from '../lib/calculations'
import type { SimulatorInputs, SimulationResults, ClimateData, Services, Location } from '../types'

type NumericField = 'roofArea' | 'floorArea' | 'electricKwh' | 'gasKwh' | 'electricPrice' | 'gasPrice'

function computeResults(state: SimulatorInputs): SimulationResults {
  const savings = calcAllSavings(
    {
      roofArea:      state.roofArea,
      floorArea:     state.floorArea,
      electricKwh:   state.electricKwh,
      gasKwh:        state.gasKwh,
      electricPrice: state.electricPrice,
      gasPrice:      state.gasPrice,
      hsp:           state.climate.hsp,
      winterTemp:    state.climate.winterTemp,
    },
    state.services
  )
  const budget = calcBudget(state.roofArea, state.floorArea, state.services)
  const paybackYears = calcPayback(budget, savings.total)
  return { savings, budget, paybackYears }
}

interface SimulatorState extends SimulatorInputs {
  results: SimulationResults
  climateLoading: boolean
  setField:          (field: NumericField, value: number) => void
  toggleService:     (service: keyof Services) => void
  setClimate:        (climate: ClimateData) => void
  setLocation:       (location: Location) => void
  setClimateLoading: (v: boolean) => void
  getInitialState:   () => SimulatorState
}

const initialInputs: SimulatorInputs = { ...DEFAULTS }
const initialResults = computeResults(initialInputs)

export const useSimulatorStore = create<SimulatorState>()((set, get) => ({
  ...initialInputs,
  results: initialResults,
  climateLoading: false,

  setField: (field, value) =>
    set(s => {
      const next = { ...s, [field]: value }
      return { ...next, results: computeResults(next) }
    }),

  toggleService: (service) =>
    set(s => {
      const services = { ...s.services, [service]: !s.services[service] }
      const next = { ...s, services }
      return { ...next, results: computeResults(next) }
    }),

  setClimate: (climate) =>
    set(s => {
      const next = { ...s, climate }
      return { ...next, results: computeResults(next) }
    }),

  setLocation: (location) => set({ location }),

  setClimateLoading: (climateLoading) => set({ climateLoading }),

  getInitialState: () => ({
    ...initialInputs,
    results: computeResults(initialInputs),
    climateLoading: false,
    setField:          get().setField,
    toggleService:     get().toggleService,
    setClimate:        get().setClimate,
    setLocation:       get().setLocation,
    setClimateLoading: get().setClimateLoading,
    getInitialState:   get().getInitialState,
  }),
}))

export type { SimulatorState }
