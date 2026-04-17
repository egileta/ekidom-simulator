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
