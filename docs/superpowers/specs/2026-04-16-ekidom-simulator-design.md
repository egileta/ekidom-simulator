# Ekidom — Simulador de Ahorro Energético
**Spec date:** 2026-04-16  
**Status:** Aprobado por usuario  
**Stack:** React 18 + Vite + TypeScript + Recharts + Zustand + Tailwind + Supabase + Vercel

---

## 1. Descripción del producto

Mini-app / landing page pública de Ekidom (instalador de placas solares, aerotermia y suelo radiante) que actúa como **lead magnet**: el usuario configura su vivienda y consumo mediante sliders, ve en tiempo real el ahorro estimado y el presupuesto de instalación, y al final introduce su email para recibir un PDF personalizado. Cada simulación se guarda en base de datos.

URL pública: Vercel (dominio gratuito, p.ej. `ekidom-simulator.vercel.app`)

---

## 2. Layout y UX

### Desktop (≥ 701px)
- **Split 50/50**: columna izquierda scrollable con sliders, columna derecha sticky con resultados y gráfica.
- Header sticky con logo Ekidom + tagline.
- Hero centrado con headline y subtítulo.

### Móvil (≤ 700px)
- Columna izquierda ocupa el ancho completo, scroll vertical.
- **Panel derecho: `position: fixed` en la parte inferior**, con handle de arrastre visible y `border-radius` superior.
- `padding-bottom: 380px` en la columna izquierda para que ningún contenido quede oculto bajo el panel fijo.
- Panel fijo expandible hacia arriba con **tap** (v1: toggle altura fija ↔ expandida; sin drag gesture).
- Toggles de servicios en **una sola fila horizontal** de 3 chips (icono + nombre + estado activo).

---

## 3. Columna izquierda — Sliders

Todas las barras son `<input type="range">` con color codificado por sistema:
- **Azul** → Solar fotovoltaica
- **Verde** → Aerotermia  
- **Ámbar** → Suelo radiante
- **Gris** → Clima (neutral)

Sliders que se atenúan (opacity 0.25, pointer-events none) cuando su servicio está desactivado en los toggles.

### Sección "Tu vivienda"
| Slider | Default | Min | Max | Unidad |
|--------|---------|-----|-----|--------|
| Superficie tejado disponible | 40 | 10 | 150 | m² |
| Superficie suelo radiante | 120 | 20 | 400 | m² |

### Sección "Tu consumo energético"
| Slider | Default | Min | Max | Unidad |
|--------|---------|-----|-----|--------|
| Consumo eléctrico anual | 5.200 | 1.000 | 20.000 | kWh/año |
| Consumo calefacción/ACS | 12.000 | 2.000 | 40.000 | kWh/año |

### Sección "Tus tarifas actuales"
| Slider | Default | Min | Max | Unidad |
|--------|---------|-----|-----|--------|
| Precio electricidad | 0,18 | 0,08 | 0,40 | €/kWh |
| Precio gas natural | 0,07 | 0,03 | 0,20 | €/kWh |

### Sección "Tu ubicación y clima"
- **Input de texto libre** (código postal, ciudad o dirección) con autocompletado.
- Flujo: texto → debounce 600ms → Nominatim geocoding → coordenadas → Open-Meteo → carga HSP, viento, temperatura.
- Badge de confirmación: "✅ Datos climáticos cargados — [Ciudad]".
- Los 3 sliders siguientes se pre-rellenan con los datos de la API y son ajustables manualmente.

| Slider | Default | Min | Max | Unidad | Fuente API |
|--------|---------|-----|-----|--------|------------|
| Horas de sol pico (HSP) | 5,2 | 2,0 | 7,0 | h/día | Open-Meteo `shortwave_radiation` |
| Velocidad media del viento | 3,4 | 1,0 | 8,0 | m/s | Open-Meteo `wind_speed_10m` |
| Temperatura media invierno | 8 | -5 | 15 | °C | Open-Meteo `temperature_2m` |

### Captura de email (al final de la columna izquierda)
- Input email + botón "Enviar →".
- Al enviar: guarda simulación en Supabase + genera PDF + envía por email vía Resend.
- Feedback inline: "📧 Presupuesto enviado a tu@email.com".

---

## 4. Columna derecha — Panel de resultados

### 4.1 Toggles de servicios (parte superior, siempre visible)

Tres filas en desktop, tres chips en una línea en móvil.

Cada toggle muestra:
- Icono + nombre del servicio
- Ahorro estimado del servicio en €/año (calculado dinámicamente)
- Switch pill de color por sistema (azul/verde/ámbar)

Al desactivar un servicio:
- La fila se atenúa (opacity 0.45)
- Su barra en la caja de ahorro desaparece (height collapse 250ms + fade)
- Su línea en la gráfica hace fade-out 300ms
- Los totales se recalculan y animan
- El marker de amortización se desplaza

### 4.2 Caja de ahorro total

- Número principal: ahorro €/año animado
- Badge delta vs media nacional (constante: `MEDIA_NACIONAL_AHORRO = 800` €/año en `constants.ts`)
- Barras de colores **solo para servicios activos** (las desactivadas se ocultan con transición)

### 4.3 Fila 2 columnas: Amortización + Presupuesto

| Celda | Contenido |
|-------|-----------|
| Amortización | años para recuperar inversión, con nota "Después: ahorro puro" |
| Presupuesto | €, con nota "Con subvenciones (~30%)" |

### 4.4 Gráfica de ahorro acumulado (Recharts LineChart)

- **4 líneas**: Total (morado), Solar (azul), Aerotermia (verde), Suelo radiante (ámbar)
- Al desactivar un servicio su línea desaparece (fade opacity), la curva Total se recalcula
- **Selector de horizonte**: 5 / 10 / 20 / 25 años (tabs)
- **Marker vertical**: año de amortización con línea discontinua ámbar, se desplaza con recálculo
- **Tooltip interactivo** al hover/touch: muestra valores de todos los servicios activos en ese año
- Leyenda inline con dots de color; los servicios inactivos se tachan
- Al cargar la página: animación stroke-dashoffset (efecto "dibuja la línea") en 1.5s por línea
- Al cambiar valores: Recharts isAnimationActive re-render suave 200ms

### 4.5 CTA

Botón "Solicitar presupuesto real →" con degradado ámbar→rojo, enlaza al formulario de email o a contacto de Ekidom.

---

## 5. Animaciones

| Evento | Animación | Duración |
|--------|-----------|----------|
| Carga inicial — números | Counter 0 → valor (easeOut) | 1.200ms |
| Carga inicial — gráfica | stroke-dashoffset draw por línea | 1.500ms |
| Mover slider — números | requestAnimationFrame tween | 200ms |
| Mover slider — barras | CSS width transition | 200ms |
| Mover slider — gráfica | Recharts re-render suave | 200ms |
| Toggle ON/OFF — barra | height collapse + fade | 250ms |
| Toggle ON/OFF — línea gráfica | opacity fade | 300ms |
| Toggle ON/OFF — marker amort. | translateX | 400ms |

---

## 6. Fórmulas de cálculo (`src/lib/calculations.ts`)

Todas las fórmulas son **ajustables por Ekidom** en un único archivo de constantes.

```typescript
// ☀️ SOLAR FOTOVOLTAICA
const paneles         = Math.floor(roofArea / 1.7)         // ~1.7m² por panel 400W
const potenciakWp     = paneles * 0.4
const produccionAnual = potenciakWp * hsp * 365 * 0.8      // rendimiento 80%
const ahorroSolar     = Math.min(produccionAnual, electricKwh) * electricPrice

// 🌡️ AEROTERMIA
const COP             = 2.5 + (winterTemp + 5) * 0.05      // COP base 2.5, mejora con temp
const consumoAero     = gasKwh / COP
const ahorroAero      = (gasKwh - consumoAero) * gasPrice   // ahorro vs caldera gas

// 🏠 SUELO RADIANTE (independiente — no depende del toggle de aerotermia)
// Calcula siempre sobre ahorroAero bruto para no crear dependencia entre toggles
const ahorroAeroBruto = (gasKwh - gasKwh / COP) * gasPrice  // siempre calculado
const eficienciaExtra = floorArea * 1.5                     // €/año base
const ahorroSuelo     = Math.min(eficienciaExtra, ahorroAeroBruto * 0.35)

// 💰 TOTALES
const ahorroTotal = (solar ? ahorroSolar : 0)
                  + (aero  ? ahorroAero  : 0)
                  + (suelo ? ahorroSuelo : 0)

// 🏗️ PRESUPUESTO
const costeSolar     = paneles * 280                        // ~280€/panel instalado
const costeAero      = 4500 + floorArea * 18                // base + €/m²
const costeSuelo     = floorArea * 22                       // €/m²
const totalBruto     = (solar ? costeSolar : 0)
                     + (aero  ? costeAero  : 0)
                     + (suelo ? costeSuelo : 0)
const subvencion     = totalBruto * 0.30                    // ~30% subvenciones IDAE
const presupuesto    = totalBruto * 0.70

// ⏱️ AMORTIZACIÓN
const amortizacion   = presupuesto / ahorroTotal            // años

// 📈 PROYECCIÓN ACUMULADA (para gráfica)
// Devuelve array de puntos {year, solar, aero, suelo, total}
// donde total incluye resta de presupuesto hasta amortización
```

> **Nota:** Los coeficientes (1.7 m²/panel, 280€/panel, COP base 2.5, 30% subvención, etc.) se centralizan en `src/lib/constants.ts` para que Ekidom los ajuste sin tocar la lógica.

---

## 7. Integraciones externas

### Geocoding — Nominatim (OpenStreetMap)
- Endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json`
- Gratuito, sin API key
- Devuelve: `lat`, `lon`, `display_name`

### Clima — Open-Meteo
- Endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=shortwave_radiation_sum,wind_speed_10m_max,temperature_2m_min`
- Gratuito, sin API key
- Cálculo HSP: `shortwave_radiation_sum (kWh/m²/día) / 1.0` → promedio anual
- Temperatura invierno: media de meses dic-feb de `temperature_2m_min`
- Viento: media anual de `wind_speed_10m_max`

### Base de datos — Supabase (free tier)
- Tabla `simulations` (ver sección 8)
- Edge Function `send-simulation` para PDF + email

### Email + PDF — Resend + @react-pdf/renderer
- Resend free tier: 100 emails/día, 3.000/mes
- PDF generado server-side en la Edge Function
- PDF: 1 página A4, diseño Ekidom (logo, colores corporativos)

---

## 8. Base de datos

### Tabla `simulations`

```sql
CREATE TABLE simulations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  email           text NOT NULL,

  -- Inputs del usuario
  roof_area       numeric NOT NULL,
  floor_area      numeric NOT NULL,
  electric_kwh    numeric NOT NULL,
  gas_kwh         numeric NOT NULL,
  electric_price  numeric NOT NULL,
  gas_price       numeric NOT NULL,
  hsp             numeric NOT NULL,
  wind_speed      numeric NOT NULL,
  winter_temp     numeric NOT NULL,

  -- Servicios activos
  service_solar   boolean NOT NULL DEFAULT true,
  service_aero    boolean NOT NULL DEFAULT true,
  service_suelo   boolean NOT NULL DEFAULT true,

  -- Ubicación
  location_label  text,
  location_lat    numeric,
  location_lon    numeric,

  -- Resultados calculados (snapshot al enviar)
  saving_total    numeric NOT NULL,
  saving_solar    numeric,
  saving_aero     numeric,
  saving_suelo    numeric,
  budget_total    numeric NOT NULL,
  payback_years   numeric NOT NULL,

  -- Tracking
  pdf_sent_at     timestamptz
);
```

---

## 9. PDF — 1 página A4

Generado server-side con `@react-pdf/renderer` en la Supabase Edge Function.

Estructura:
1. **Header**: Logo Ekidom + "Simulación de ahorro energético" + ciudad + fecha
2. **Bloque principal**: Ahorro total €/año + años amortización (tipografía grande, barra visual)
3. **Servicios activos**: fila por cada servicio ON con ahorro individual y barra de proporción
4. **Datos de la vivienda**: 2 columnas (vivienda + consumo)
5. **Presupuesto**: total con nota de subvenciones
6. **Footer CTA**: "Contacta con Ekidom" + email + web

---

## 10. Deploy

| Servicio | Plan | Límite relevante |
|----------|------|-----------------|
| Vercel | Free | Builds ilimitados, dominio `.vercel.app` |
| Supabase | Free | 500MB DB, 2GB transferencia, 500K Edge Function invocations/mes |
| Resend | Free | 100 emails/día, 3.000/mes |
| Open-Meteo | Free | Sin límite documentado para uso razonable |
| Nominatim | Free | 1 req/s máximo (con debounce 600ms cumplimos) |

---

## 11. Estructura de proyecto

```
ekidom-simulator/
├── public/
│   └── ekidom-logo.png
├── src/
│   ├── components/
│   │   ├── Header/
│   │   ├── Hero/
│   │   ├── SliderPanel/
│   │   │   ├── SliderGroup.tsx
│   │   │   └── LocationInput.tsx
│   │   ├── ResultsPanel/
│   │   │   ├── ServiceToggles.tsx
│   │   │   ├── SavingsCard.tsx
│   │   │   ├── MetricsRow.tsx
│   │   │   └── SavingsChart.tsx
│   │   └── EmailCapture/
│   ├── hooks/
│   │   ├── useSimulator.ts
│   │   ├── useClimateData.ts
│   │   └── useAnimatedValue.ts
│   ├── lib/
│   │   ├── calculations.ts
│   │   ├── constants.ts        ← coeficientes ajustables
│   │   ├── pdf.tsx
│   │   └── supabase.ts
│   ├── store/
│   │   └── simulatorStore.ts   ← Zustand
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── supabase/
│   └── functions/
│       └── send-simulation/
│           └── index.ts        ← genera PDF + envía email
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 12. Fuera de alcance (v1)

- Autenticación de usuarios
- Panel de administración para Ekidom
- Comparativa con otras empresas
- Integración con CRM
- Modo multiidioma
- Ajuste de coeficientes desde UI (solo en `constants.ts`)
