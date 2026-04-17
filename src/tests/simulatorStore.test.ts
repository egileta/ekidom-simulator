import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulatorStore } from '../store/simulatorStore'

// Reset store between tests
beforeEach(() => {
  useSimulatorStore.setState(useSimulatorStore.getInitialState())
})

describe('simulatorStore', () => {
  it('initialises with default values', () => {
    const s = useSimulatorStore.getState()
    expect(s.roofArea).toBe(40)
    expect(s.services.solar).toBe(true)
  })

  it('setField updates a numeric field', () => {
    useSimulatorStore.getState().setField('roofArea', 80)
    expect(useSimulatorStore.getState().roofArea).toBe(80)
  })

  it('toggleService flips a service flag', () => {
    useSimulatorStore.getState().toggleService('aero')
    expect(useSimulatorStore.getState().services.aero).toBe(false)
    useSimulatorStore.getState().toggleService('aero')
    expect(useSimulatorStore.getState().services.aero).toBe(true)
  })

  it('results.savings.total is positive with defaults', () => {
    const { results } = useSimulatorStore.getState()
    expect(results.savings.total).toBeGreaterThan(0)
  })

  it('results update when roofArea changes', () => {
    // Use a high electricKwh so solar production is not capped, then compare
    useSimulatorStore.getState().setField('electricKwh', 50000)
    const before = useSimulatorStore.getState().results.savings.solar
    useSimulatorStore.getState().setField('roofArea', 100)
    const after = useSimulatorStore.getState().results.savings.solar
    expect(after).toBeGreaterThan(before)
  })

  it('results.savings.aero is 0 when aero service is off', () => {
    useSimulatorStore.getState().toggleService('aero')
    expect(useSimulatorStore.getState().results.savings.aero).toBe(0)
  })

  it('setClimate updates climate and recalculates', () => {
    const before = useSimulatorStore.getState().results.savings.total
    useSimulatorStore.getState().setClimate({ hsp: 7, windSpeed: 3, winterTemp: 15 })
    const after = useSimulatorStore.getState().results.savings.total
    expect(after).toBeGreaterThan(before)
  })
})
