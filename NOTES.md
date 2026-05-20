# Notas del proyecto — Ekidom Simulador

## 2026-05-20 — Eliminación de Supabase, migración a Vercel API Route

**Decisión:** Se eliminó la dependencia de Supabase del flujo de envío de simulaciones.

**Motivo:** Supabase solo se usaba para dos cosas:
1. Guardar cada simulación en una tabla `simulations` (lead capture en BD)
2. Hospedar la Edge Function que llama a Resend para enviar el PDF por email

Se decidió que guardar en BD es innecesario en esta fase; con enviar el email al usuario es suficiente.

**Cambios realizados:**
- `src/lib/email.ts` — nueva función `sendSimulation` que llama directamente a `/api/send-simulation`
- `api/send-simulation.ts` — nueva Vercel Serverless Function que llama a Resend
- `src/components/SliderPanel/index.tsx` — import actualizado a `../../lib/email`
- `src/lib/supabase.ts` — comentado (conservado como referencia)
- `supabase/functions/send-simulation/index.ts` — comentado (conservado como referencia)
- `supabase/migrations/20260416000000_create_simulations.sql` — comentado (conservado como referencia del schema)
- `@supabase/supabase-js` desinstalado del proyecto

**Variables de entorno necesarias en Vercel:**
- `RESEND_API_KEY` — ya debería estar configurada de la etapa anterior

**Para reactivar la BD en el futuro:**
- Descomentar la migración SQL y ejecutarla en Supabase
- Añadir el insert al inicio de `api/send-simulation.ts` usando el cliente de Supabase
- El schema está documentado en `supabase/migrations/20260416000000_create_simulations.sql`

---

## Pendientes / Ideas futuras

- [ ] Panel admin para ver leads (requeriría reactivar BD o usar Resend Audiences)
- [ ] A/B test del CTA de email capture
