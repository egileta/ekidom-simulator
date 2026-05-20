import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, results, pdfBase64 } = req.body

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ekidom Simulador <onboarding@resend.dev>',
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

    return res.status(200).json({ success: true })

  } catch (err) {
    return res.status(200).json({ success: false, error: (err as Error).message })
  }
}
