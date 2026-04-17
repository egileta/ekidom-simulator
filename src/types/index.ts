export interface Services {
  solar: boolean
  aero:  boolean
  suelo: boolean
}

export interface ClimateData {
  hsp:        number   // horas sol pico / día
  windSpeed:  number   // m/s
  winterTemp: number   // °C
}

export interface Location {
  label: string
  lat:   number
  lon:   number
}

export interface SimulatorInputs {
  roofArea:       number
  floorArea:      number
  electricKwh:    number
  gasKwh:         number
  electricPrice:  number
  gasPrice:       number
  climate:        ClimateData
  location:       Location | null
  services:       Services
}

export interface ServiceSavings {
  solar: number
  aero:  number
  suelo: number
  total: number
}

export interface SimulationResults {
  savings:      ServiceSavings
  budget:       number
  paybackYears: number
}

export interface ProjectionPoint {
  year:  number
  solar: number
  aero:  number
  suelo: number
  total: number
}

export interface SimulationPayload {
  inputs:    SimulatorInputs
  results:   SimulationResults
  email:     string
  pdfBase64: string
}
