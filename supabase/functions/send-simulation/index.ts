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
