import { SOLAR, AERO, SUELO, FINANCE } from './constants'
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
  services: Services
): number {
  const panels = Math.floor(roofArea / SOLAR.M2_PER_PANEL)
  const costSolar = panels * SOLAR.COST_PER_PANEL
  const costAero  = AERO.BASE_COST + floorArea * AERO.COST_PER_M2
  const costSuelo = floorArea * SUELO.COST_PER_M2
  const gross = (services.solar ? costSolar : 0)
              + (services.aero  ? costAero  : 0)
              + (services.suelo ? costSuelo : 0)
  return gross * (1 - FINANCE.SUBSIDY_RATE)
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
  return Array.from({ length: horizonYears + 1 }, (_, i) => ({
    year:  i,
    solar: +(savings.solar * i).toFixed(0),
    aero:  +(savings.aero  * i).toFixed(0),
    suelo: +(savings.suelo * i).toFixed(0),
    total: +(savings.total * i).toFixed(0),
  }))
}
