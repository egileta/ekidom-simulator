// DESACTIVADO 2026-05-20: Esta Edge Function ha sido reemplazada por la Vercel
// API Route en api/send-simulation.ts. El envío de email se hace ahora directamente
// desde Vercel usando RESEND_API_KEY como variable de entorno.
// Se conserva como referencia; la parte de BD (insert en 'simulations') también
// está documentada en supabase/migrations/20260416000000_create_simulations.sql.

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }
//
// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }
//
//   try {
//     const { email, inputs, results, pdfBase64 } = await req.json()
//
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL')!,
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//     )
//
//     // 1. Save simulation to DB
//     const { error: dbError } = await supabase.from('simulations').insert({
//       email,
//       ...inputs,
//       ...results,
//       pdf_sent_at: new Date().toISOString(),
//     })
//     if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)
//
//     // 2. Send email via Resend
//     const resendKey = Deno.env.get('RESEND_API_KEY')!
//     const emailRes = await fetch('https://api.resend.com/emails', { ... })
//     ...
//   }
// })
