// ─── EKIDOM ADJUSTABLE COEFFICIENTS ───────────────────────────────────────────
// Edit this file to tune calculations without touching business logic.

import type { SimulatorInputs } from '../types'

export const SOLAR = {
  M2_PER_PANEL:     1.7,    // m² de tejado por panel
  KW_PER_PANEL:     0.4,    // kWp por panel
  EFFICIENCY:       0.80,   // factor rendimiento sistema
  COST_PER_PANEL:   280,    // €/panel instalado (mano de obra incluida)
}

export const AERO = {
  COP_BASE:         2.5,    // COP a 0°C
  COP_TEMP_FACTOR:  0.05,   // mejora de COP por °C de temperatura invierno
  BASE_COST:        4500,   // € coste fijo instalación aerotermia
  COST_PER_M2:      18,     // €/m² suelo radiante para aerotermia
}

export const SUELO = {
  SAVINGS_PER_M2:   1.5,    // €/año/m² por distribución eficiente
  AERO_RATIO_CAP:   0.35,   // tope: 35% del ahorro bruto de aerotermia
  COST_PER_M2:      22,     // €/m² instalación suelo radiante
}

export const FINANCE = {
  SUBSIDY_RATE:     0.30,   // % subvención IDAE estimada
}

export const DISPLAY = {
  MEDIA_NACIONAL_AHORRO: 800,  // €/año media nacional (para badge comparativo)
}

export const DEFAULTS: SimulatorInputs = {
  roofArea:      40,
  floorArea:     120,
  electricKwh:   5200,
  gasKwh:        12000,
  electricPrice: 0.18,
  gasPrice:      0.07,
  climate: {
    hsp:        5.2,
    windSpeed:  3.4,
    winterTemp: 8,
  },
  location: null,
  services: { solar: true, aero: true, suelo: true },
}

// Seasonal monthly factors for Spain (index 0=Jan … 11=Dec, sums ≈ 12 each)
export const SEASONAL = {
  SOLAR: [0.41, 0.62, 0.93, 1.14, 1.34, 1.66, 1.76, 1.55, 1.14, 0.72, 0.41, 0.31],
  HEAT:  [2.40, 2.07, 1.53, 0.87, 0.33, 0.05, 0.00, 0.00, 0.16, 0.65, 1.64, 2.29],
}

export const SLIDER_LIMITS = {
  roofArea:      { min: 10,   max: 150,   step: 1     },
  floorArea:     { min: 20,   max: 400,   step: 5     },
  electricKwh:   { min: 1000, max: 20000, step: 100   },
  gasKwh:        { min: 2000, max: 40000, step: 200   },
  electricPrice: { min: 0.08, max: 0.40,  step: 0.01  },
  gasPrice:      { min: 0.03, max: 0.20,  step: 0.01  },
  hsp:           { min: 2.0,  max: 7.0,   step: 0.1   },
  windSpeed:     { min: 1.0,  max: 8.0,   step: 0.1   },
  winterTemp:    { min: -5,   max: 15,    step: 1     },
}
