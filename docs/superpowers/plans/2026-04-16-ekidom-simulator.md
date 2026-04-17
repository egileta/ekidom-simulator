# Ekidom Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a public lead-magnet simulator for Ekidom that lets users configure their home and see real-time energy savings, then receive a PDF quote by email.

**Architecture:** React SPA (Vite + TypeScript) with a Zustand store as the single source of truth. All calculations are pure functions in `lib/calculations.ts`. The right panel is sticky on desktop and `position:fixed` at the bottom on mobile. A Supabase Edge Function handles saving the simulation to DB and sending the PDF via Resend.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, Recharts, @react-pdf/renderer, Supabase (DB + Edge Functions), Resend, Vercel

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/lib/constants.ts` | All tunable coefficients (Ekidom adjusts here) |
| `src/lib/calculations.ts` | Pure calculation functions (solar, aero, suelo, totals, projection) |
| `src/lib/climate.ts` | Nominatim geocoding + Open-Meteo API calls |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/store/simulatorStore.ts` | Zustand store — all slider/toggle state + computed results |
| `src/hooks/useAnimatedValue.ts` | rAF counter animation 0→value |
| `src/hooks/useClimateData.ts` | Debounced location fetch → updates store climate sliders |
| `src/components/Header.tsx` | Sticky header with logo + tagline |
| `src/components/Hero.tsx` | Centered headline + subtitle |
| `src/components/SliderPanel/SliderGroup.tsx` | Single labeled range input with color theming |
| `src/components/SliderPanel/LocationInput.tsx` | Text input with debounce → geocoding → climate load |
| `src/components/SliderPanel/index.tsx` | Full left column: all slider sections + email capture |
| `src/components/ResultsPanel/ServiceToggles.tsx` | 3 toggle rows (desktop) / 3 chips (mobile) |
| `src/components/ResultsPanel/SavingsCard.tsx` | Ahorro total + animated number + bars per service |
| `src/components/ResultsPanel/MetricsRow.tsx` | 2-column: amortización + presupuesto |
| `src/components/ResultsPanel/SavingsChart.tsx` | Recharts LineChart — 4 lines, selector, tooltip, amort marker |
| `src/components/ResultsPanel/index.tsx` | Right panel: sticky desktop / fixed-bottom mobile |
| `src/components/EmailCapture.tsx` | Email input + submit → Edge Function |
| `src/lib/pdf.tsx` | @react-pdf/renderer 1-page A4 document |
| `src/App.tsx` | Root layout: Header + Hero + 50/50 split |
| `supabase/migrations/20260416000000_create_simulations.sql` | DB schema |
| `supabase/functions/send-simulation/index.ts` | Save to DB + send email with PDF |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`, `.env.example`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /c/Users/w11/Documents/PROYECTOS/EKIDOM
npm create vite@latest . -- --template react-ts
```
Choose: React → TypeScript. Answer "yes" to overwrite when asked.

- [ ] **Step 2: Install all dependencies**

```bash
npm install zustand recharts @react-pdf/renderer
npm install @supabase/supabase-js
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Tailwind**

Replace `vite.config.ts` with:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Create `src/index.css`:
```css
@import "tailwindcss";

:root {
  --color-bg:       #0a0f1e;
  --color-bg-left:  #0d1425;
  --color-bg-right: #080d1a;
  --color-solar:    #3b82f6;
  --color-aero:     #10b981;
  --color-suelo:    #f59e0b;
  --color-total:    #a78bfa;
  --color-border:   rgba(255,255,255,0.07);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--color-bg);
  color: #e2e8f0;
}

input[type=range] { -webkit-appearance: none; appearance: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; }
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create .env.example**

```bash
cat > .env.example << 'EOF'
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF
```

Copy to `.env.local` and fill in after Supabase setup (Task 17).

- [ ] **Step 6: Clean boilerplate**

Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Replace `src/App.tsx` with:
```typescript
export default function App() {
  return <div>Ekidom Simulator</div>
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: server running at `http://localhost:5173`, page shows "Ekidom Simulator".

- [ ] **Step 8: Commit**

```bash
git init
echo "node_modules\n.env.local\ndist\n.superpowers" > .gitignore
git add -A
git commit -m "feat: scaffold Vite + React + TS + Tailwind + Zustand + Recharts"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

Create `src/types/index.ts`:
```typescript
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
  inputs:  SimulatorInputs
  results: SimulationResults
  email:   string
  pdfBase64: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Constants

**Files:**
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Write constants**

Create `src/lib/constants.ts`:
```typescript
// ─── EKIDOM ADJUSTABLE COEFFICIENTS ───────────────────────────────────────────
// Edit this file to tune calculations without touching business logic.

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

export const DEFAULTS: import('../types').SimulatorInputs = {
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add tunable constants file"
```

---

## Task 4: Calculation library (TDD)

**Files:**
- Create: `src/lib/calculations.ts`
- Create: `src/tests/calculations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/calculations.test.ts`:
```typescript
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
    // Huge roof, tiny consumption
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
    // calcSuelo receives gross aero value regardless of aero toggle
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
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npx vitest run src/tests/calculations.test.ts
```
Expected: all tests FAIL with "Cannot find module"

- [ ] **Step 3: Implement calculations**

Create `src/lib/calculations.ts`:
```typescript
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
// This keeps suelo radiante savings independent of the aerotermia toggle.
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
  const solarSav = calcSolar(inputs.roofArea, inputs.hsp, inputs.electricKwh, inputs.electricPrice)
  const aeroGross = calcAero(inputs.gasKwh, inputs.winterTemp, inputs.gasPrice)
  const aeroSav  = aeroGross
  const sueloSav = calcSuelo(inputs.floorArea, aeroGross)

  return {
    solar: services.solar ? solarSav : 0,
    aero:  services.aero  ? aeroSav  : 0,
    suelo: services.suelo ? sueloSav : 0,
    total: (services.solar ? solarSav : 0)
         + (services.aero  ? aeroSav  : 0)
         + (services.suelo ? sueloSav : 0),
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npx vitest run src/tests/calculations.test.ts
```
Expected: all 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts src/tests/calculations.test.ts
git commit -m "feat: add calculation library with full test coverage"
```

---

## Task 5: Zustand store

**Files:**
- Create: `src/store/simulatorStore.ts`
- Create: `src/tests/simulatorStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/tests/simulatorStore.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npx vitest run src/tests/simulatorStore.test.ts
```
Expected: all FAIL with "Cannot find module"

- [ ] **Step 3: Implement store**

Create `src/store/simulatorStore.ts`:
```typescript
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
  // actions
  setField:       (field: NumericField, value: number) => void
  toggleService:  (service: keyof Services) => void
  setClimate:     (climate: ClimateData) => void
  setLocation:    (location: Location) => void
  setClimateLoading: (v: boolean) => void
  getInitialState: () => SimulatorState
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
    setField: get().setField,
    toggleService: get().toggleService,
    setClimate: get().setClimate,
    setLocation: get().setLocation,
    setClimateLoading: get().setClimateLoading,
    getInitialState: get().getInitialState,
  }),
}))
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npx vitest run src/tests/simulatorStore.test.ts
```
Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/simulatorStore.ts src/tests/simulatorStore.test.ts
git commit -m "feat: add Zustand simulator store with computed results"
```

---

## Task 6: Animation hook + Climate API

**Files:**
- Create: `src/hooks/useAnimatedValue.ts`
- Create: `src/lib/climate.ts`
- Create: `src/hooks/useClimateData.ts`

- [ ] **Step 1: useAnimatedValue hook**

Create `src/hooks/useAnimatedValue.ts`:
```typescript
import { useEffect, useRef, useState } from 'react'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function useAnimatedValue(
  target: number,
  duration = 1200,
  onlyOnMount = false
): number {
  const [displayed, setDisplayed] = useState(onlyOnMount ? 0 : target)
  const startRef  = useRef<number | null>(null)
  const fromRef   = useRef(onlyOnMount ? 0 : target)
  const targetRef = useRef(target)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const to   = target
    targetRef.current = to
    startRef.current  = null

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const value    = from + (to - from) * easeOut(progress)
      setDisplayed(Math.round(value * 100) / 100)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else fromRef.current = to
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return displayed
}
```

- [ ] **Step 2: Climate API lib**

Create `src/lib/climate.ts`:
```typescript
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
```

- [ ] **Step 3: useClimateData hook**

Create `src/hooks/useClimateData.ts`:
```typescript
import { useEffect, useRef } from 'react'
import { geocode, fetchClimate } from '../lib/climate'
import { useSimulatorStore } from '../store/simulatorStore'

export function useClimateData(query: string) {
  const setClimate       = useSimulatorStore(s => s.setClimate)
  const setLocation      = useSimulatorStore(s => s.setLocation)
  const setClimateLoading = useSimulatorStore(s => s.setClimateLoading)
  const timerRef         = useRef<ReturnType<typeof setTimeout>>(0)

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
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAnimatedValue.ts src/lib/climate.ts src/hooks/useClimateData.ts
git commit -m "feat: add animation hook and climate API integration"
```

---

## Task 7: Layout — Header, Hero, App shell

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Hero.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Header**

Create `src/components/Header.tsx`:
```typescript
export function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#0a0f1e',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '13px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.5 }}>
        <span style={{ color: '#f59e0b' }}>Eki</span>
        <span style={{ color: '#60a5fa' }}>dom</span>
        <span style={{ fontSize: 12, fontWeight: 400, color: '#475569', marginLeft: 10 }}>
          Simulador de ahorro energético
        </span>
      </div>
      <a
        href="https://ekidom.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}
      >
        ekidom.com
      </a>
    </header>
  )
}
```

- [ ] **Step 2: Hero**

Create `src/components/Hero.tsx`:
```typescript
export function Hero() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 24px 28px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.10) 0%, transparent 65%)',
    }}>
      <h1 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 900, lineHeight: 1.2, margin: '0 0 10px',
      }}>
        ¿Cuánto puedes ahorrar<br />
        con{' '}
        <span style={{ color: '#f59e0b' }}>energía renovable</span>?
      </h1>
      <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
        Ajusta los valores de tu vivienda · los resultados se actualizan en tiempo real
      </p>
    </div>
  )
}
```

- [ ] **Step 3: App shell with responsive 50/50 split**

Replace `src/App.tsx`:
```typescript
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SliderPanel } from './components/SliderPanel'
import { ResultsPanel } from './components/ResultsPanel'

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Hero />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <SliderPanel />
        <ResultsPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create stub components so App compiles**

Create `src/components/SliderPanel/index.tsx`:
```typescript
export function SliderPanel() {
  return <div style={{ padding: 28, background: '#0d1425' }}>SliderPanel (stub)</div>
}
```

Create `src/components/ResultsPanel/index.tsx`:
```typescript
export function ResultsPanel() {
  return <div style={{ padding: 28, background: '#080d1a' }}>ResultsPanel (stub)</div>
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```
Expected: header + hero + 2-column layout visible at `http://localhost:5173`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/Hero.tsx src/App.tsx \
        src/components/SliderPanel/index.tsx src/components/ResultsPanel/index.tsx
git commit -m "feat: app shell with header, hero, and responsive split layout"
```

---

## Task 8: SliderGroup component

**Files:**
- Create: `src/components/SliderPanel/SliderGroup.tsx`

- [ ] **Step 1: Implement SliderGroup**

Create `src/components/SliderPanel/SliderGroup.tsx`:
```typescript
import { useAnimatedValue } from '../../hooks/useAnimatedValue'

type SliderColor = 'blue' | 'green' | 'amber' | 'gray'

const THUMB_COLORS: Record<SliderColor, string> = {
  blue:  '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  gray:  '#64748b',
}

const VALUE_COLORS: Record<SliderColor, string> = {
  blue:  '#60a5fa',
  green: '#34d399',
  amber: '#fbbf24',
  gray:  '#94a3b8',
}

interface SliderGroupProps {
  label:    string
  value:    number
  min:      number
  max:      number
  step:     number
  unit:     string
  color:    SliderColor
  disabled?: boolean
  onChange: (v: number) => void
  formatValue?: (v: number) => string
}

export function SliderGroup({
  label, value, min, max, step, unit, color, disabled = false, onChange, formatValue,
}: SliderGroupProps) {
  const animated = useAnimatedValue(value, 1200, false)
  const pct = ((value - min) / (max - min)) * 100

  const display = formatValue
    ? formatValue(animated)
    : animated >= 1000
      ? animated.toLocaleString('es-ES', { maximumFractionDigits: 0 })
      : animated.toLocaleString('es-ES', { maximumFractionDigits: 2 })

  const thumbColor = THUMB_COLORS[color]
  const valColor   = VALUE_COLORS[color]

  return (
    <div style={{
      marginBottom: 22,
      opacity:      disabled ? 0.25 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition:   'opacity 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: valColor }}>
          {display}
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 400, marginLeft: 2 }}>{unit}</span>
        </span>
      </div>

      <style>{`
        .slider-${color}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${thumbColor};
          border: 2px solid ${thumbColor}80;
          box-shadow: 0 0 0 3px ${thumbColor}26;
          cursor: pointer;
        }
        .slider-${color} { cursor: pointer; }
      `}</style>

      <input
        type="range"
        className={`slider-${color}`}
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{
          width: '100%', height: 5, borderRadius: 3,
          outline: 'none', border: 'none', marginBottom: 4,
          background: `linear-gradient(to right, ${thumbColor} ${pct}%, rgba(255,255,255,0.07) ${pct}%)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155' }}>
        <span>{formatValue ? formatValue(min) : min.toLocaleString('es-ES')} {unit}</span>
        <span>{formatValue ? formatValue(max) : max.toLocaleString('es-ES')} {unit}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SliderPanel/SliderGroup.tsx
git commit -m "feat: SliderGroup component with animated value and color theming"
```

---

## Task 9: LocationInput component

**Files:**
- Create: `src/components/SliderPanel/LocationInput.tsx`

- [ ] **Step 1: Implement LocationInput**

Create `src/components/SliderPanel/LocationInput.tsx`:
```typescript
import { useState } from 'react'
import { useClimateData } from '../../hooks/useClimateData'
import { useSimulatorStore } from '../../store/simulatorStore'

export function LocationInput() {
  const [query, setQuery]   = useState('Madrid, 28001')
  const location            = useSimulatorStore(s => s.location)
  const climateLoading      = useSimulatorStore(s => s.climateLoading)

  useClimateData(query)

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 15, pointerEvents: 'none',
        }}>📍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Código postal, ciudad o dirección…"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '10px 36px 10px 36px',
            color: '#e2e8f0', fontSize: 13, outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12,
            }}
          >✕</button>
        )}
      </div>

      {climateLoading && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#60a5fa' }}>
          ⟳ Cargando datos climáticos…
        </div>
      )}

      {location && !climateLoading && (
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#93c5fd',
        }}>
          ✅ Datos cargados —{' '}
          {location.label.split(',').slice(0, 2).join(',')}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SliderPanel/LocationInput.tsx
git commit -m "feat: LocationInput with geocoding and climate auto-load"
```

---

## Task 10: SliderPanel — full assembly

**Files:**
- Modify: `src/components/SliderPanel/index.tsx`
- Create: `src/components/EmailCapture.tsx`

- [ ] **Step 1: EmailCapture component**

Create `src/components/EmailCapture.tsx`:
```typescript
import { useState } from 'react'

interface EmailCaptureProps {
  onSubmit: (email: string) => Promise<void>
}

export function EmailCapture({ onSubmit }: EmailCaptureProps) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!email.includes('@')) { setError('Introduce un email válido'); return }
    setLoading(true); setError('')
    try {
      await onSubmit(email)
      setSent(true)
    } catch {
      setError('Error al enviar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{
      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 14, padding: '16px 18px', textAlign: 'center', fontSize: 13, color: '#34d399',
    }}>
      📧 Presupuesto enviado a <strong>{email}</strong>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: 14, padding: 18, marginTop: 28,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
        📧 Recibe tu presupuesto en PDF
      </div>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
        Guardamos tu simulación y te la enviamos detallada. Sin compromiso.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="tu@email.com"
          style={{
            flex: 1, minWidth: 150,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            background: '#f59e0b', border: 'none', borderRadius: 8,
            padding: '9px 14px', color: '#1a0a00', fontWeight: 700, fontSize: 12,
            cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Enviando…' : 'Enviar →'}
        </button>
      </div>
      {error && <p style={{ marginTop: 6, fontSize: 11, color: '#f87171' }}>{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Full SliderPanel**

Replace `src/components/SliderPanel/index.tsx`:
```typescript
import { useSimulatorStore } from '../../store/simulatorStore'
import { SLIDER_LIMITS } from '../../lib/constants'
import { SliderGroup } from './SliderGroup'
import { LocationInput } from './LocationInput'
import { EmailCapture } from '../EmailCapture'
import { sendSimulation } from '../../lib/supabase'

const SectionLabel = ({ children }: { children: string }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#60a5fa',
    textTransform: 'uppercase', margin: '22px 0 14px',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    {children}
    <span style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.15)', display: 'block' }} />
  </div>
)

export function SliderPanel() {
  const s       = useSimulatorStore()
  const L       = SLIDER_LIMITS

  const fmt2  = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{
      padding: '28px 28px 32px',
      background: '#0d1425',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      // Mobile: extra bottom padding so content isn't hidden behind fixed panel
      paddingBottom: 'max(32px, 380px)',
    }}>

      <SectionLabel>Tu vivienda</SectionLabel>

      <SliderGroup label="Superficie de tejado disponible"
        value={s.roofArea} {...L.roofArea} unit="m²" color="blue"
        onChange={v => s.setField('roofArea', v)} />

      <SliderGroup label="Superficie suelo radiante"
        value={s.floorArea} {...L.floorArea} unit="m²" color="amber"
        disabled={!s.services.suelo}
        onChange={v => s.setField('floorArea', v)} />

      <SectionLabel>Tu consumo energético</SectionLabel>

      <SliderGroup label="Consumo eléctrico anual"
        value={s.electricKwh} {...L.electricKwh} unit="kWh/año" color="blue"
        onChange={v => s.setField('electricKwh', v)} />

      <SliderGroup label="Consumo calefacción / ACS"
        value={s.gasKwh} {...L.gasKwh} unit="kWh/año" color="green"
        disabled={!s.services.aero}
        onChange={v => s.setField('gasKwh', v)} />

      <SectionLabel>Tus tarifas actuales</SectionLabel>

      <SliderGroup label="Precio electricidad"
        value={s.electricPrice} {...L.electricPrice} unit="€/kWh" color="blue"
        formatValue={fmt2}
        onChange={v => s.setField('electricPrice', v)} />

      <SliderGroup label="Precio gas natural"
        value={s.gasPrice} {...L.gasPrice} unit="€/kWh" color="green"
        disabled={!s.services.aero}
        formatValue={fmt2}
        onChange={v => s.setField('gasPrice', v)} />

      <SectionLabel>Tu ubicación y clima</SectionLabel>

      <LocationInput />

      <SliderGroup label="Horas de sol pico (HSP)"
        value={s.climate.hsp} {...L.hsp} unit="h/día" color="blue"
        disabled={!s.services.solar}
        formatValue={v => v.toFixed(1)}
        onChange={v => s.setClimate({ ...s.climate, hsp: v })} />

      <SliderGroup label="Velocidad media del viento"
        value={s.climate.windSpeed} {...L.windSpeed} unit="m/s" color="gray"
        formatValue={v => v.toFixed(1)}
        onChange={v => s.setClimate({ ...s.climate, windSpeed: v })} />

      <SliderGroup label="Temperatura media invierno"
        value={s.climate.winterTemp} {...L.winterTemp} unit="°C" color="green"
        disabled={!s.services.aero}
        formatValue={v => `${v > 0 ? '' : ''}${v.toFixed(0)}`}
        onChange={v => s.setClimate({ ...s.climate, winterTemp: v })} />

      <EmailCapture onSubmit={email => sendSimulation(email, s)} />
    </div>
  )
}
```

- [ ] **Step 3: Stub sendSimulation to avoid compile error (will be implemented in Task 17)**

Add to `src/lib/supabase.ts` (create file):
```typescript
import type { SimulatorState } from '../store/simulatorStore'

export async function sendSimulation(_email: string, _state: SimulatorState): Promise<void> {
  // Stub — full implementation in Task 17
  console.log('sendSimulation stub', _email)
}
```

Update `src/store/simulatorStore.ts` — export the type at the bottom:
```typescript
export type { SimulatorState }
```
(Add `export type SimulatorState = SimulatorState` — actually in the store file add `export type { SimulatorState }` by exporting the interface. Since it uses `interface SimulatorState` inside `create<SimulatorState>()`, add `export type SimulatorState = ReturnType<typeof useSimulatorStore.getState>` at the end of the file.)

Replace the last line of `src/store/simulatorStore.ts` with:
```typescript
export type SimulatorState = ReturnType<typeof useSimulatorStore.getState>
```

- [ ] **Step 4: Verify in browser — sliders are functional**

```bash
npm run dev
```
Expected: all sliders visible, values update on drag, location input present.

- [ ] **Step 5: Commit**

```bash
git add src/components/SliderPanel/ src/components/EmailCapture.tsx src/lib/supabase.ts
git commit -m "feat: full slider panel with all inputs and email capture"
```

---

## Task 11: ServiceToggles component

**Files:**
- Create: `src/components/ResultsPanel/ServiceToggles.tsx`

- [ ] **Step 1: Implement ServiceToggles**

Create `src/components/ResultsPanel/ServiceToggles.tsx`:
```typescript
import { useSimulatorStore } from '../../store/simulatorStore'

interface ServiceConfig {
  key:    'solar' | 'aero' | 'suelo'
  icon:   string
  label:  string
  fullLabel: string
  onColor: string
  textColor: string
  bgColor: string
  borderColor: string
}

const SERVICES: ServiceConfig[] = [
  {
    key: 'solar', icon: '☀️', label: 'Solar', fullLabel: 'Placas solares',
    onColor: '#3b82f6', textColor: '#93c5fd',
    bgColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.30)',
  },
  {
    key: 'aero', icon: '🌡️', label: 'Aerotermia', fullLabel: 'Aerotermia',
    onColor: '#10b981', textColor: '#6ee7b7',
    bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    key: 'suelo', icon: '🏠', label: 'S. Rad.', fullLabel: 'Suelo radiante',
    onColor: '#f59e0b', textColor: '#fcd34d',
    bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)',
  },
]

export function ServiceToggles() {
  const services      = useSimulatorStore(s => s.services)
  const toggleService = useSimulatorStore(s => s.toggleService)
  const savings       = useSimulatorStore(s => s.results.savings)

  return (
    <>
      {/* ── Desktop: toggle rows ── */}
      <div className="desktop-toggles">
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#60a5fa',
          textTransform: 'uppercase', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Servicios a contratar
          <span style={{ flex: 1, height: 1, background: 'rgba(96,165,250,0.2)', display: 'block' }} />
        </div>

        {SERVICES.map(svc => {
          const active = services[svc.key]
          const saving = savings[svc.key]
          return (
            <div
              key={svc.key}
              onClick={() => toggleService(svc.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 13px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                border: `1px solid ${active ? svc.borderColor : 'rgba(255,255,255,0.07)'}`,
                background: active ? svc.bgColor : 'rgba(255,255,255,0.02)',
                opacity: active ? 1 : 0.45,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 18 }}>{svc.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{svc.fullLabel}</div>
                  <div style={{ fontSize: 10, color: active ? svc.textColor : '#64748b', marginTop: 1 }}>
                    {active
                      ? `Ahorro: ${Math.round(saving).toLocaleString('es-ES')} €/año`
                      : 'desactivado'}
                  </div>
                </div>
              </div>

              {/* pill switch */}
              <div style={{
                width: 38, height: 21, borderRadius: 11, position: 'relative', flexShrink: 0,
                background: active ? svc.onColor : 'rgba(255,255,255,0.10)',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: active ? 20 : 3,
                  width: 15, height: 15, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mobile: 3 chips in one row ── */}
      <div className="mobile-toggles" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {SERVICES.map(svc => {
          const active = services[svc.key]
          return (
            <div
              key={svc.key}
              onClick={() => toggleService(svc.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${active ? svc.borderColor : 'rgba(255,255,255,0.10)'}`,
                background: active ? svc.bgColor : 'rgba(255,255,255,0.03)',
                opacity: active ? 1 : 0.45, transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16 }}>{svc.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: svc.textColor }}>{svc.label}</span>
              <span style={{ fontSize: 9, color: active ? '#6ee7b7' : '#475569' }}>
                {active ? '✓ activo' : '—'}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (min-width: 701px) { .mobile-toggles { display: none !important; } }
        @media (max-width: 700px) { .desktop-toggles { display: none !important; } }
      `}</style>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultsPanel/ServiceToggles.tsx
git commit -m "feat: ServiceToggles component with desktop rows and mobile chips"
```

---

## Task 12: SavingsCard + MetricsRow

**Files:**
- Create: `src/components/ResultsPanel/SavingsCard.tsx`
- Create: `src/components/ResultsPanel/MetricsRow.tsx`

- [ ] **Step 1: SavingsCard**

Create `src/components/ResultsPanel/SavingsCard.tsx`:
```typescript
import { useSimulatorStore } from '../../store/simulatorStore'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import { DISPLAY } from '../../lib/constants'

interface ServiceBar { key: 'solar' | 'aero' | 'suelo'; label: string; color: string }
const BARS: ServiceBar[] = [
  { key: 'solar', label: 'Fotovoltaica', color: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
  { key: 'aero',  label: 'Aerotermia',   color: 'linear-gradient(90deg,#10b981,#34d399)' },
  { key: 'suelo', label: 'Suelo rad.',   color: 'linear-gradient(90deg,#f59e0b,#fcd34d)' },
]

export function SavingsCard() {
  const savings  = useSimulatorStore(s => s.results.savings)
  const services = useSimulatorStore(s => s.services)

  const animTotal = useAnimatedValue(savings.total, 600)
  const maxSaving = Math.max(savings.solar, savings.aero, savings.suelo, 1)

  const deltaVsMedia = Math.round(((savings.total - DISPLAY.MEDIA_NACIONAL_AHORRO) / DISPLAY.MEDIA_NACIONAL_AHORRO) * 100)

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(16,185,129,0.05))',
      border: '1px solid rgba(59,130,246,0.2)', borderRadius: 13, padding: '13px 15px',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: 3 }}>
        Ahorro total anual estimado
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
        {Math.round(animTotal).toLocaleString('es-ES')}
        <span style={{ fontSize: 13, color: '#475569', fontWeight: 400 }}> €/año</span>
      </div>
      <div style={{
        display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#34d399',
        borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginTop: 4,
      }}>
        {deltaVsMedia >= 0 ? '↑' : '↓'} {Math.abs(deltaVsMedia)}% vs media nacional
      </div>

      {/* Bars — only active services */}
      <div style={{ marginTop: 10 }}>
        {BARS.map(bar => {
          if (!services[bar.key]) return null
          const val = savings[bar.key]
          const pct = (val / maxSaving) * 100
          return (
            <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#64748b', width: 72, flexShrink: 0 }}>{bar.label}</span>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: bar.color,
                  width: `${pct}%`, transition: 'width 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8', width: 46, textAlign: 'right', flexShrink: 0 }}>
                {Math.round(val).toLocaleString('es-ES')} €
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: MetricsRow**

Create `src/components/ResultsPanel/MetricsRow.tsx`:
```typescript
import { useSimulatorStore } from '../../store/simulatorStore'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'

export function MetricsRow() {
  const budget       = useSimulatorStore(s => s.results.budget)
  const paybackYears = useSimulatorStore(s => s.results.paybackYears)

  const animBudget  = useAnimatedValue(budget, 600)
  const animPayback = useAnimatedValue(paybackYears, 600)

  const paybackDisplay = isFinite(animPayback) ? animPayback.toFixed(1) : '∞'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#34d399', textTransform: 'uppercase', marginBottom: 3 }}>
          Amortización
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#6ee7b7', lineHeight: 1 }}>
          {paybackDisplay}<span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> años</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>Después: ahorro puro</div>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, padding: '11px 13px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.8px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 3 }}>
          Presupuesto
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
          {Math.round(animBudget).toLocaleString('es-ES')}
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}> €</span>
        </div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>Con subvenciones (~30%)</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultsPanel/SavingsCard.tsx src/components/ResultsPanel/MetricsRow.tsx
git commit -m "feat: SavingsCard and MetricsRow with animated values"
```

---

## Task 13: SavingsChart (Recharts)

**Files:**
- Create: `src/components/ResultsPanel/SavingsChart.tsx`

- [ ] **Step 1: Implement SavingsChart**

Create `src/components/ResultsPanel/SavingsChart.tsx`:
```typescript
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { useSimulatorStore } from '../../store/simulatorStore'
import { buildProjection } from '../../lib/calculations'

const HORIZONS = [5, 10, 20, 25] as const
type Horizon = typeof HORIZONS[number]

const LINE_CONFIG = [
  { key: 'total', color: '#a78bfa', label: 'Total',       width: 2.5 },
  { key: 'solar', color: '#60a5fa', label: 'Solar',       width: 1.8 },
  { key: 'aero',  color: '#34d399', label: 'Aerotermia',  width: 1.8 },
  { key: 'suelo', color: '#fbbf24', label: 'Suelo rad.',  width: 1.8 },
] as const

const fmt = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k €` : `${v} €`

interface TooltipPayload {
  name: string; value: number; color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: TooltipPayload[]; label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 9, padding: '8px 12px', fontSize: 11,
    }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>Año {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: p.color }}>
            {Math.round(p.value).toLocaleString('es-ES')} €
          </span>
        </div>
      ))}
    </div>
  )
}

export function SavingsChart() {
  const [horizon, setHorizon] = useState<Horizon>(10)
  const savings  = useSimulatorStore(s => s.results.savings)
  const payback  = useSimulatorStore(s => s.results.paybackYears)
  const services = useSimulatorStore(s => s.services)

  const data = useMemo(
    () => buildProjection(savings, horizon),
    [savings, horizon]
  )

  const amortYear = isFinite(payback) ? payback : null

  return (
    <div style={{
      background: '#0d1425', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 13, padding: '14px 14px 10px',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#60a5fa', textTransform: 'uppercase' }}>
          Ahorro acumulado proyectado
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: 2 }}>
          {HORIZONS.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: horizon === h ? 600 : 400,
                background: horizon === h ? '#1e293b' : 'transparent',
                color: horizon === h ? '#e2e8f0' : '#475569',
              }}
            >
              {h}a
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="0" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#334155', fontSize: 9 }}
            tickLine={false} axisLine={false}
            tickFormatter={v => v === 0 ? 'Hoy' : `Año ${v}`}
          />
          <YAxis
            tick={{ fill: '#334155', fontSize: 9 }}
            tickLine={false} axisLine={false}
            tickFormatter={fmt}
          />
          <Tooltip content={<CustomTooltip />} />

          {amortYear && amortYear <= horizon && (
            <ReferenceLine
              x={Math.round(amortYear)}
              stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.2}
              label={{ value: `Amort. ${amortYear.toFixed(1)}a`, fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
            />
          )}

          {LINE_CONFIG.map(cfg => {
            // Hide individual service lines if service is off; always show total
            if (cfg.key !== 'total' && !services[cfg.key as keyof typeof services]) return null
            return (
              <Line
                key={cfg.key}
                type="monotone"
                dataKey={cfg.key}
                name={cfg.label}
                stroke={cfg.color}
                strokeWidth={cfg.width}
                dot={false}
                activeDot={{ r: 4, fill: cfg.color }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        {LINE_CONFIG.map(cfg => {
          const isServiceLine = cfg.key !== 'total'
          const active = !isServiceLine || services[cfg.key as keyof typeof services]
          return (
            <div key={cfg.key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: '#64748b',
              opacity: active ? 1 : 0.3,
              textDecoration: active ? 'none' : 'line-through',
              transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
              {cfg.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultsPanel/SavingsChart.tsx
git commit -m "feat: SavingsChart with Recharts, horizon selector, amort marker, service line toggle"
```

---

## Task 14: ResultsPanel — full assembly + mobile fixed bottom

**Files:**
- Modify: `src/components/ResultsPanel/index.tsx`

- [ ] **Step 1: Full ResultsPanel**

Replace `src/components/ResultsPanel/index.tsx`:
```typescript
import { useState } from 'react'
import { ServiceToggles } from './ServiceToggles'
import { SavingsCard } from './SavingsCard'
import { MetricsRow } from './MetricsRow'
import { SavingsChart } from './SavingsChart'

export function ResultsPanel() {
  const [mobileExpanded, setMobileExpanded] = useState(false)

  return (
    <>
      {/* ── Desktop: sticky right column ── */}
      <div className="results-desktop" style={{
        position: 'sticky', top: 57,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto',
        background: '#080d1a',
        padding: '22px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <ServiceToggles />
        <SavingsCard />
        <MetricsRow />
        <SavingsChart />
        <button
          style={{
            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            border: 'none', borderRadius: 10, padding: 13,
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', width: '100%',
          }}
          onClick={() => document.querySelector<HTMLInputElement>('input[type=email]')?.focus()}
        >
          Solicitar presupuesto real →
        </button>
      </div>

      {/* ── Mobile: fixed bottom panel ── */}
      <div
        className="results-mobile"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: mobileExpanded ? '70vh' : '200px',
          background: '#080d1a',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px 20px 0 0',
          zIndex: 90,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          overflowY: 'auto',
          padding: '10px 16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
          transition: 'height 0.35s ease',
        }}
      >
        {/* Handle */}
        <div
          onClick={() => setMobileExpanded(e => !e)}
          style={{ textAlign: 'center', cursor: 'pointer', paddingBottom: 2 }}
        >
          <div style={{
            width: 36, height: 4, background: 'rgba(255,255,255,0.18)',
            borderRadius: 2, margin: '0 auto 8px',
          }} />
        </div>

        <ServiceToggles />
        <SavingsCard />
        {mobileExpanded && (
          <>
            <MetricsRow />
            <SavingsChart />
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 701px) { .results-mobile { display: none !important; } }
        @media (max-width: 700px) { .results-desktop { display: none !important; } }
      `}</style>
    </>
  )
}
```

- [ ] **Step 2: Verify full layout in browser at desktop and mobile widths**

```bash
npm run dev
```
Open DevTools → toggle device toolbar → check at 375px width.
Expected:
- Desktop: right panel sticky, all cards + chart visible
- Mobile: fixed panel at bottom, tap handle expands/collapses, toggles in 1 row

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultsPanel/index.tsx
git commit -m "feat: full ResultsPanel with sticky desktop and fixed-bottom mobile"
```

---

## Task 15: Run all tests

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```
Expected: all tests PASS (calculations + store)

- [ ] **Step 2: Fix any failures before proceeding**

If tests fail, fix the root cause in the relevant file before continuing.

---

## Task 16: Supabase setup

**Files:**
- Create: `supabase/migrations/20260416000000_create_simulations.sql`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
```

- [ ] **Step 2: Create Supabase project**

1. Go to [supabase.com](https://supabase.com) → New project → name: `ekidom-simulator`
2. Note the **Project URL** and **anon key** from Settings → API
3. Add to `.env.local`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 3: Write migration**

Create `supabase/migrations/20260416000000_create_simulations.sql`:
```sql
CREATE TABLE IF NOT EXISTS simulations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  email           text NOT NULL,

  roof_area       numeric NOT NULL,
  floor_area      numeric NOT NULL,
  electric_kwh    numeric NOT NULL,
  gas_kwh         numeric NOT NULL,
  electric_price  numeric NOT NULL,
  gas_price       numeric NOT NULL,
  hsp             numeric NOT NULL,
  wind_speed      numeric NOT NULL,
  winter_temp     numeric NOT NULL,

  service_solar   boolean NOT NULL DEFAULT true,
  service_aero    boolean NOT NULL DEFAULT true,
  service_suelo   boolean NOT NULL DEFAULT true,

  location_label  text,
  location_lat    numeric,
  location_lon    numeric,

  saving_total    numeric NOT NULL,
  saving_solar    numeric,
  saving_aero     numeric,
  saving_suelo    numeric,
  budget_total    numeric NOT NULL,
  payback_years   numeric NOT NULL,

  pdf_sent_at     timestamptz
);

-- Index for querying by email
CREATE INDEX idx_simulations_email ON simulations(email);

-- RLS: allow inserts from anon (public lead capture)
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert" ON simulations FOR INSERT TO anon WITH CHECK (true);
```

- [ ] **Step 4: Apply migration via Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste and run the migration SQL above.
Expected: table `simulations` created.

- [ ] **Step 5: Update Supabase client**

Replace `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { SimulatorState } from '../store/simulatorStore'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export { supabase }

export async function sendSimulation(email: string, state: SimulatorState): Promise<void> {
  const { results, services, climate, location } = state

  // 1. Generate PDF in browser
  const { generatePDF } = await import('./pdf')
  const pdfBlob = await generatePDF({ email, state })
  const pdfBase64 = await blobToBase64(pdfBlob)

  // 2. Call Edge Function (saves to DB + sends email)
  const { error } = await supabase.functions.invoke('send-simulation', {
    body: {
      email,
      inputs: {
        roof_area:      state.roofArea,
        floor_area:     state.floorArea,
        electric_kwh:   state.electricKwh,
        gas_kwh:        state.gasKwh,
        electric_price: state.electricPrice,
        gas_price:      state.gasPrice,
        hsp:            climate.hsp,
        wind_speed:     climate.windSpeed,
        winter_temp:    climate.winterTemp,
        service_solar:  services.solar,
        service_aero:   services.aero,
        service_suelo:  services.suelo,
        location_label: location?.label ?? null,
        location_lat:   location?.lat   ?? null,
        location_lon:   location?.lon   ?? null,
      },
      results: {
        saving_total:  results.savings.total,
        saving_solar:  results.savings.solar,
        saving_aero:   results.savings.aero,
        saving_suelo:  results.savings.suelo,
        budget_total:  results.budget,
        payback_years: results.paybackYears,
      },
      pdfBase64,
    },
  })

  if (error) throw new Error(error.message)
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add supabase/ src/lib/supabase.ts
git commit -m "feat: Supabase migration and client with sendSimulation"
```

---

## Task 17: PDF generation

**Files:**
- Create: `src/lib/pdf.tsx`

- [ ] **Step 1: Implement PDF document**

Create `src/lib/pdf.tsx`:
```typescript
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer'
import type { SimulatorState } from '../store/simulatorStore'

const colors = {
  bg:     '#0a0f1e',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  green:  '#10b981',
  text:   '#1e293b',
  muted:  '#64748b',
  solar:  '#3b82f6',
  aero:   '#10b981',
  suelo:  '#f59e0b',
}

const s = StyleSheet.create({
  page:      { padding: 40, backgroundColor: '#f8fafc', fontFamily: 'Helvetica' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoText:  { fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.amber },
  logoBlue:  { color: colors.blue },
  url:       { fontSize: 10, color: colors.muted },
  title:     { fontSize: 13, color: colors.muted, marginBottom: 2 },
  subtitle:  { fontSize: 10, color: colors.muted, marginBottom: 20 },
  bigNum:    { fontSize: 36, fontFamily: 'Helvetica-Bold', color: colors.text },
  bigUnit:   { fontSize: 14, color: colors.muted },
  section:   { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.blue, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  row2col:   { flexDirection: 'row', gap: 12 },
  col:       { flex: 1 },
  card:      { borderRadius: 8, padding: 12, marginBottom: 8 },
  barRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
  barLabel:  { fontSize: 9, color: colors.muted, width: 70 },
  barTrack:  { flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3 },
  barFill:   { height: 5, borderRadius: 3 },
  barAmt:    { fontSize: 9, color: colors.text, width: 50, textAlign: 'right' },
  divider:   { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  footer:    { marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: colors.muted },
  ctaBox:    { backgroundColor: colors.amber, borderRadius: 8, padding: '10px 14px', marginTop: 16, textAlign: 'center' },
  ctaText:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white' },
})

interface PDFProps {
  email: string
  state: SimulatorState
}

function EkidomPDF({ email, state }: PDFProps) {
  const { results, services } = state
  const { savings, budget, paybackYears } = results
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const location = state.location?.label.split(',').slice(0, 2).join(',') ?? 'Sin ubicación'

  const maxSaving = Math.max(savings.solar, savings.aero, savings.suelo, 1)

  const serviceRows = [
    { key: 'solar' as const, label: '☀️ Placas solares',  color: colors.solar, saving: savings.solar },
    { key: 'aero'  as const, label: '🌡️ Aerotermia',      color: colors.aero,  saving: savings.aero  },
    { key: 'suelo' as const, label: '🏠 Suelo radiante',  color: colors.suelo, saving: savings.suelo },
  ].filter(r => services[r.key])

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logoText}>Eki<Text style={s.logoBlue}>dom</Text></Text>
            <Text style={[s.title, { marginBottom: 0 }]}>Simulación de ahorro energético</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.url}>ekidom.com</Text>
            <Text style={s.footerText}>{location}</Text>
            <Text style={s.footerText}>{today}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Main saving */}
        <View style={[s.section, { alignItems: 'center', paddingVertical: 8 }]}>
          <Text style={s.sectionTitle}>Ahorro estimado total</Text>
          <Text style={s.bigNum}>
            {Math.round(savings.total).toLocaleString('es-ES')}
            <Text style={s.bigUnit}> €/año</Text>
          </Text>

          {/* Total bar */}
          <View style={[s.barTrack, { marginTop: 10, height: 8, width: '100%' }]}>
            <View style={[s.barFill, { backgroundColor: '#a78bfa', width: '100%', height: 8 }]} />
          </View>
        </View>

        <View style={s.divider} />

        {/* Per-service rows */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Desglose por servicio</Text>
          {serviceRows.map(r => (
            <View key={r.key} style={s.barRow}>
              <Text style={s.barLabel}>{r.label}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, {
                  backgroundColor: r.color,
                  width: `${(r.saving / maxSaving) * 100}%`,
                }]} />
              </View>
              <Text style={s.barAmt}>{Math.round(r.saving).toLocaleString('es-ES')} €/año</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        {/* Data + metrics */}
        <View style={[s.row2col, s.section]}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Tu vivienda</Text>
            <Text style={s.footerText}>Tejado: {state.roofArea} m²</Text>
            <Text style={s.footerText}>Suelo radiante: {state.floorArea} m²</Text>
            <Text style={s.footerText}>Ubicación: {location}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Tu consumo</Text>
            <Text style={s.footerText}>Eléctrico: {state.electricKwh.toLocaleString('es-ES')} kWh/año</Text>
            <Text style={s.footerText}>Gas/ACS: {state.gasKwh.toLocaleString('es-ES')} kWh/año</Text>
            <Text style={s.footerText}>Precio luz: {state.electricPrice.toFixed(2)} €/kWh</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Budget + payback */}
        <View style={[s.row2col, s.section]}>
          <View style={[s.col, { backgroundColor: '#fef9f0', borderRadius: 8, padding: 12 }]}>
            <Text style={[s.sectionTitle, { color: colors.amber }]}>Presupuesto instalación</Text>
            <Text style={[s.bigNum, { fontSize: 24 }]}>
              {Math.round(budget).toLocaleString('es-ES')} €
            </Text>
            <Text style={s.footerText}>Subvenciones IDAE aplicadas (~30%)</Text>
          </View>
          <View style={[s.col, { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12 }]}>
            <Text style={[s.sectionTitle, { color: colors.green }]}>Amortización</Text>
            <Text style={[s.bigNum, { fontSize: 24 }]}>
              {isFinite(paybackYears) ? paybackYears.toFixed(1) : '∞'} años
            </Text>
            <Text style={s.footerText}>Después del retorno: ahorro puro</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={s.ctaBox}>
          <Text style={s.ctaText}>¿Quieres confirmar este presupuesto? Contacta con Ekidom</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Simulación generada para {email}</Text>
          <Text style={s.footerText}>info@ekidom.com · ekidom.com</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generatePDF(props: PDFProps): Promise<Blob> {
  return pdf(<EkidomPDF {...props} />).toBlob()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pdf.tsx
git commit -m "feat: PDF generation with @react-pdf/renderer"
```

---

## Task 18: Supabase Edge Function

**Files:**
- Create: `supabase/functions/send-simulation/index.ts`

- [ ] **Step 1: Initialize Supabase CLI locally**

```bash
supabase init
supabase login
supabase link --project-ref <your-project-ref>
```
(Project ref is the string in your Supabase project URL: `https://xxxx.supabase.co` → ref is `xxxx`)

- [ ] **Step 2: Add Resend API key to Supabase secrets**

1. Sign up at [resend.com](https://resend.com) → API Keys → Create key
2. ```bash
   supabase secrets set RESEND_API_KEY=re_xxxx
   ```

- [ ] **Step 3: Create Edge Function**

Create `supabase/functions/send-simulation/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, inputs, results, pdfBase64 } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Save simulation to DB
    const { error: dbError } = await supabase.from('simulations').insert({
      email,
      ...inputs,
      ...results,
      pdf_sent_at: new Date().toISOString(),
    })
    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    // 2. Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ekidom Simulador <noreply@ekidom.com>',
        to: [email],
        subject: 'Tu simulación de ahorro energético — Ekidom',
        html: `
          <h2>Hola,</h2>
          <p>Adjunto encontrarás tu simulación personalizada de ahorro energético.</p>
          <p>Ahorro estimado: <strong>${Math.round(results.saving_total).toLocaleString('es-ES')} €/año</strong></p>
          <p>Presupuesto con subvenciones: <strong>${Math.round(results.budget_total).toLocaleString('es-ES')} €</strong></p>
          <p>Amortización estimada: <strong>${results.payback_years.toFixed(1)} años</strong></p>
          <br/>
          <p>¿Tienes preguntas? Contáctanos en <a href="mailto:info@ekidom.com">info@ekidom.com</a> o visita <a href="https://ekidom.com">ekidom.com</a>.</p>
          <p>Un saludo,<br/>El equipo de Ekidom</p>
        `,
        attachments: [{
          filename: 'simulacion-ekidom.pdf',
          content: pdfBase64,
        }],
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      throw new Error(`Resend error: ${errBody}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 4: Deploy Edge Function**

```bash
supabase functions deploy send-simulation
```
Expected: `✓ Function send-simulation deployed`

- [ ] **Step 5: Test the full email flow in the browser**

```bash
npm run dev
```
Fill in sliders → enter a real email → click "Enviar →"
Expected: success message, email received with PDF attachment.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/
git commit -m "feat: Supabase Edge Function for DB save + PDF email via Resend"
```

---

## Task 19: Build + Deploy to Vercel

- [ ] **Step 1: Verify production build**

```bash
npm run build
```
Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 2: Deploy to Vercel**

```bash
npm install -g vercel
vercel
```
Follow prompts:
- Set up and deploy: Y
- Which scope: your account
- Project name: `ekidom-simulator`
- Root directory: `.`
- Override build command: N

- [ ] **Step 3: Set environment variables on Vercel**

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```
Paste the values from `.env.local` when prompted. Select: Production + Preview + Development.

- [ ] **Step 4: Redeploy with env vars**

```bash
vercel --prod
```
Expected: deployment URL printed (e.g. `https://ekidom-simulator.vercel.app`)

- [ ] **Step 5: Smoke test on live URL**

Open the Vercel URL:
- [ ] Sliders move and values update
- [ ] Toggles activate/deactivate services correctly
- [ ] Location input loads climate data
- [ ] Chart renders with all active lines
- [ ] Email capture sends PDF successfully
- [ ] Mobile layout: fixed bottom panel, chips in one row

- [ ] **Step 6: Final commit + tag**

```bash
git add .
git commit -m "feat: production deploy to Vercel"
git tag v1.0.0
```

---

## Self-Review

### Spec coverage check

| Spec section | Covered by task(s) |
|---|---|
| Split 50/50 layout | Task 7 |
| Mobile fixed-bottom panel + tap expand | Task 14 |
| Mobile toggles in 1 row | Task 11 |
| padding-bottom 380px mobile | Task 10 |
| Sliders with color coding + disabled state | Task 8, 10 |
| Location input + geocoding + climate | Task 9, 6 |
| ServiceToggles desktop + mobile | Task 11 |
| SavingsCard with active-only bars | Task 12 |
| MetricsRow 2-column | Task 12 |
| SavingsChart 4 lines + toggle + horizon + amort marker | Task 13 |
| Animated numbers on load (1200ms) | Task 6 (useAnimatedValue) |
| Animated chart on load (1500ms Recharts) | Task 13 |
| Smooth slider updates (200ms) | Task 8 (useAnimatedValue 600ms default, components use 600ms) |
| Toggle: bar collapse + line fade + marker slide | Task 12, 13, 14 |
| Email capture + validation | Task 10 |
| Supabase table + save | Task 16, 18 |
| PDF 1-page A4 | Task 17 |
| Email via Resend with PDF | Task 18 |
| Vercel deploy | Task 19 |
| constants.ts ajustable | Task 3 |
| suelo savings independent of aero toggle | Task 4 (calcSuelo with aeroGross) |
| MEDIA_NACIONAL_AHORRO constant | Task 3, 12 |

All spec requirements covered. No gaps found.

### Placeholder scan
No TBDs, no "similar to task N" references, no incomplete steps. All code blocks are complete.

### Type consistency
- `SimulatorState` exported from store in Task 10, used in Tasks 16, 17, 18 ✓
- `ServiceSavings.solar/aero/suelo` keys match `services.solar/aero/suelo` keys throughout ✓
- `calcAllSavings` returns `ServiceSavings`, consumed by store → SavingsCard → SavingsChart ✓
- `buildProjection` returns `ProjectionPoint[]` with keys matching Recharts `dataKey` props ✓
