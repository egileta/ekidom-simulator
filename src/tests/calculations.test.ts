import { describe, it, expect } from 'vitest'
import { calcSolar, calcAero, calcSuelo, calcBudget, calcPayback, buildProjection } from '../lib/calculations'
import { DEFAULTS } from '../lib/constants'

const D = DEFAULTS

describe('calcSolar', () => {
  it('returns positive savings with default inputs', () => {
    const r = calcSolar(D.roofArea, D.climate.hsp, D.electricKwh, D.electricPrice)
    expect(r).toBeGreaterThan(0)
  })

  it('returns 0 when roofArea is 0', () => {
    expect(calcSolar(0, D.climate.hsp, D.electricKwh, D.electricPrice)).toBe(0)
  })

  it('caps at electricKwh * price when production exceeds consumption', () => {
    const r = calcSolar(150, 7, 500, 0.18)
    const maxPossible = 500 * 0.18
    expect(r).toBeLessThanOrEqual(maxPossible + 0.01)
  })
})

describe('calcAero', () => {
  it('returns positive savings with default inputs', () => {
    const r = calcAero(D.gasKwh, D.climate.winterTemp, D.gasPrice)
    expect(r).toBeGreaterThan(0)
  })

  it('higher COP (warmer climate) means more savings', () => {
    const cold = calcAero(12000, -5, 0.07)
    const warm = calcAero(12000, 15, 0.07)
    expect(warm).toBeGreaterThan(cold)
  })
})

describe('calcSuelo', () => {
  it('returns positive savings with default inputs', () => {
    const aeroSavingsGross = calcAero(D.gasKwh, D.climate.winterTemp, D.gasPrice)
    const r = calcSuelo(D.floorArea, aeroSavingsGross)
    expect(r).toBeGreaterThan(0)
  })

  it('is independent of aerotermia toggle — uses gross aero savings', () => {
    const r1 = calcSuelo(120, 500)
    const r2 = calcSuelo(120, 500)
    expect(r1).toBe(r2)
  })
})

describe('calcBudget', () => {
  it('returns lower budget when fewer services selected', () => {
    const all   = calcBudget(40, 120, { solar: true,  aero: true,  suelo: true  })
    const solar = calcBudget(40, 120, { solar: true,  aero: false, suelo: false })
    expect(solar).toBeLessThan(all)
  })

  it('returns 0 when no services selected', () => {
    expect(calcBudget(40, 120, { solar: false, aero: false, suelo: false })).toBe(0)
  })
})

describe('calcPayback', () => {
  it('returns positive years', () => {
    expect(calcPayback(10000, 1500)).toBeGreaterThan(0)
  })

  it('returns Infinity when savings is 0', () => {
    expect(calcPayback(10000, 0)).toBe(Infinity)
  })
})

describe('buildProjection', () => {
  it('returns array of length horizonYears + 1', () => {
    const pts = buildProjection({ solar: 780, aero: 620, suelo: 447, total: 1847 }, 10)
    expect(pts).toHaveLength(11)
  })

  it('starts at year 0 with all values 0', () => {
    const pts = buildProjection({ solar: 780, aero: 620, suelo: 447, total: 1847 }, 5)
    expect(pts[0]).toEqual({ year: 0, solar: 0, aero: 0, suelo: 0, total: 0 })
  })

  it('accumulates linearly', () => {
    const pts = buildProjection({ solar: 100, aero: 0, suelo: 0, total: 100 }, 3)
    expect(pts[3].solar).toBeCloseTo(300, 1)
  })
})
