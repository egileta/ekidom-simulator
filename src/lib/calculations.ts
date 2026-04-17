import { SOLAR, AERO, SUELO, FINANCE, SEASONAL } from './constants'
import type { Services, ServiceSavings, ProjectionPoint } from '../types'

export function calcSolar(
  roofArea: number,
  hsp: number,
  electricKwh: number,
  electricPrice: number
): number {
  const panels = Math.floor(roofArea / SOLAR.M2_PER_PANEL)
  if (panels === 0) return 0
  const kWp = panels * SOLAR.KW_PER_PANEL
  const production = kWp * hsp * 365 * SOLAR.EFFICIENCY
  return Math.min(production, electricKwh) * electricPrice
}

export function calcAero(
  gasKwh: number,
  winterTemp: number,
  gasPrice: number
): number {
  const COP = AERO.COP_BASE + (winterTemp + 5) * AERO.COP_TEMP_FACTOR
  const consumoAero = gasKwh / COP
  return (gasKwh - consumoAero) * gasPrice
}

// NOTE: aeroSavingsGross must be the raw calcAero result, regardless of aero toggle.
export function calcSuelo(floorArea: number, aeroSavingsGross: number): number {
  const base = floorArea * SUELO.SAVINGS_PER_M2
  return Math.min(base, aeroSavingsGross * SUELO.AERO_RATIO_CAP)
}

export function calcBudget(
  roofArea: number,
  floorArea: number,
  services: Services,
  subsidyEnabled = true
): number {
  const panels = Math.floor(roofArea / SOLAR.M2_PER_PANEL)
  const costSolar = panels * SOLAR.COST_PER_PANEL
  const costAero  = AERO.BASE_COST + floorArea * AERO.COST_PER_M2
  const costSuelo = floorArea * SUELO.COST_PER_M2
  const gross = (services.solar ? costSolar : 0)
              + (services.aero  ? costAero  : 0)
              + (services.suelo ? costSuelo : 0)
  return subsidyEnabled ? gross * (1 - FINANCE.SUBSIDY_RATE) : gross
}

export function calcPayback(budget: number, savingsTotal: number): number {
  if (savingsTotal === 0) return Infinity
  return budget / savingsTotal
}

export function calcAllSavings(
  inputs: {
    roofArea: number; floorArea: number
    electricKwh: number; gasKwh: number
    electricPrice: number; gasPrice: number
    hsp: number; winterTemp: number
  },
  services: Services
): ServiceSavings {
  const solarSav  = calcSolar(inputs.roofArea, inputs.hsp, inputs.electricKwh, inputs.electricPrice)
  const aeroGross = calcAero(inputs.gasKwh, inputs.winterTemp, inputs.gasPrice)
  const sueloSav  = calcSuelo(inputs.floorArea, aeroGross)

  return {
    solar: services.solar ? solarSav : 0,
    aero:  services.aero  ? aeroGross : 0,
    suelo: services.suelo ? sueloSav  : 0,
    total: (services.solar ? solarSav  : 0)
         + (services.aero  ? aeroGross : 0)
         + (services.suelo ? sueloSav  : 0),
  }
}

export function buildProjection(
  savings: ServiceSavings,
  horizonYears: number
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [{ year: 0, solar: 0, aero: 0, suelo: 0, total: 0 }]
  let cumSolar = 0, cumAero = 0, cumSuelo = 0

  for (let m = 0; m < horizonYears * 12; m++) {
    const mi = m % 12
    cumSolar += (savings.solar / 12) * SEASONAL.SOLAR[mi]
    cumAero  += (savings.aero  / 12) * SEASONAL.HEAT[mi]
    cumSuelo += (savings.suelo / 12) * SEASONAL.HEAT[mi]
    points.push({
      year:  +((m + 1) / 12).toFixed(4),
      solar: +cumSolar.toFixed(0),
      aero:  +cumAero.toFixed(0),
      suelo: +cumSuelo.toFixed(0),
      total: +(cumSolar + cumAero + cumSuelo).toFixed(0),
    })
  }

  return points
}
