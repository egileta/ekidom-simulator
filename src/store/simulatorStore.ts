import { create } from 'zustand'
import { DEFAULTS } from '../lib/constants'
import { calcAllSavings, calcBudget, calcPayback } from '../lib/calculations'
import type { SimulatorInputs, SimulationResults, ClimateData, Services, Location } from '../types'

type NumericField = 'roofArea' | 'floorArea' | 'electricKwh' | 'gasKwh' | 'electricPrice' | 'gasPrice'

function computeResults(state: SimulatorInputs, subsidyEnabled: boolean): SimulationResults {
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
  const budget = calcBudget(state.roofArea, state.floorArea, state.services, subsidyEnabled)
  const paybackYears = calcPayback(budget, savings.total)
  return { savings, budget, paybackYears }
}

interface SimulatorState extends SimulatorInputs {
  results: SimulationResults
  climateLoading: boolean
  subsidyEnabled: boolean
  setField:          (field: NumericField, value: number) => void
  toggleService:     (service: keyof Services) => void
  toggleSubsidy:     () => void
  reset:             () => void
  setClimate:        (climate: ClimateData) => void
  setLocation:       (location: Location) => void
  setClimateLoading: (v: boolean) => void
  getInitialState:   () => SimulatorState
}

const initialInputs: SimulatorInputs = { ...DEFAULTS }
const initialResults = computeResults(initialInputs, true)

export const useSimulatorStore = create<SimulatorState>()((set, get) => ({
  ...initialInputs,
  results: initialResults,
  climateLoading: false,
  subsidyEnabled: true,

  setField: (field, value) =>
    set(s => {
      const next = { ...s, [field]: value }
      return { ...next, results: computeResults(next, s.subsidyEnabled) }
    }),

  toggleService: (service) =>
    set(s => {
      const services = { ...s.services, [service]: !s.services[service] }
      const next = { ...s, services }
      return { ...next, results: computeResults(next, s.subsidyEnabled) }
    }),

  toggleSubsidy: () =>
    set(s => {
      const subsidyEnabled = !s.subsidyEnabled
      return { subsidyEnabled, results: computeResults(s, subsidyEnabled) }
    }),

  reset: () =>
    set({ ...initialInputs, results: computeResults(initialInputs, true), subsidyEnabled: true }),

  setClimate: (climate) =>
    set(s => {
      const next = { ...s, climate }
      return { ...next, results: computeResults(next, s.subsidyEnabled) }
    }),

  setLocation: (location) => set({ location }),

  setClimateLoading: (climateLoading) => set({ climateLoading }),

  getInitialState: () => ({
    ...initialInputs,
    results: computeResults(initialInputs, true),
    climateLoading: false,
    subsidyEnabled: true,
    setField:          get().setField,
    toggleService:     get().toggleService,
    toggleSubsidy:     get().toggleSubsidy,
    reset:             get().reset,
    setClimate:        get().setClimate,
    setLocation:       get().setLocation,
    setClimateLoading: get().setClimateLoading,
    getInitialState:   get().getInitialState,
  }),
}))

export type { SimulatorState }
