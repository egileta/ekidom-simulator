import { useState } from 'react'
import { T } from '../lib/theme'

interface EmailCaptureProps {
  onSubmit: (email: string) => Promise<void>
  onReset:  () => void
}

export function EmailCapture({ onSubmit, onReset }: EmailCaptureProps) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      // Surface a user-friendly message while keeping the raw error for debugging
      if (msg.toLowerCase().includes('domain')) {
        setError('Error de envío: dominio del remitente no verificado. Contacta con info@ekidom.com.')
      } else {
        setError(`Error al enviar: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{
      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 14, padding: '16px 18px', marginTop: 28,
    }}>
      <div style={{ textAlign: 'center', fontSize: 13, color: T.SUCCESS }}>
        📧 Presupuesto enviado a <strong>{email}</strong>
      </div>
      <button
        onClick={() => { setSent(false); setEmail(''); onReset() }}
        style={{
          marginTop: 12, width: '100%',
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.BORDER}`,
          borderRadius: 8, padding: '8px 12px',
          color: T.TEXT_MUTED, fontSize: 11, cursor: 'pointer',
        }}
      >
        ↺ Nueva simulación
      </button>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: 14, padding: 18, marginTop: 28,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.WARNING, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
        📧 Recibe tu presupuesto en PDF
      </div>
      <p style={{ fontSize: 12, color: T.TEXT_MUTED, marginBottom: 4 }}>
        Guardamos tu simulación y te la enviamos detallada. Sin compromiso.
      </p>
      <p style={{ fontSize: 11, color: T.TEXT_DIM, marginBottom: 12 }}>
        Solo funciona con Gmail de momento.
      </p>

      <input
        id="email-input"
        type="email" value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="tu@email.com"
        style={{
          width: '100%', marginBottom: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '9px 12px', color: 'white', fontSize: 12,
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Button row: Reiniciar (1/3) + Enviar (2/3) */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onReset}
          style={{
            flex: '0 0 calc(33% - 4px)',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.BORDER}`,
            borderRadius: 8, padding: '9px 0',
            color: T.TEXT_MUTED, fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ↺ Reiniciar
        </button>
        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            flex: 1,
            background: T.GRAD_CTA, border: 'none', borderRadius: 8,
            padding: '9px 14px', color: 'white', fontWeight: 700, fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Enviando…' : 'Enviar →'}
        </button>
      </div>

      {error && <p style={{ marginTop: 8, fontSize: 11, color: T.ERROR, lineHeight: 1.4 }}>{error}</p>}
    </div>
  )
}
