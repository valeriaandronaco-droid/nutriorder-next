'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async () => {
    if (!telefono || !password) return setError('Inserisci telefono e password')
    setLoading(true)
    setError(null)

    // Supabase usa email — usiamo telefono@nutriorder.app come email fittizia
    const email = `${telefono.replace(/\s/g, '')}@nutriorder.app`

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenziali non valide')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const C = {
    primary: '#50162C', accent: '#D55189',
    cream: '#FDF8FA', border: '#E8D0DA',
    muted: '#8A7A7E', white: '#FFFFFF',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.white, borderRadius: 24, boxShadow: '0 8px 40px rgba(80,22,44,0.12)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, #33091A, ${C.primary})`, padding: '32px 28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌸</div>
          <h1 style={{ margin: 0, color: C.white, fontSize: 24, fontFamily: 'Georgia, serif' }}>NutriOrder</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Accedi al tuo account</p>
        </div>
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#C0392B', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Numero di telefono</label>
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="+39 333 1234567"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, color: '#2C2C2C', background: C.cream, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, color: '#2C2C2C', background: C.cream, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${C.primary}, #7A2444)`, color: C.white, border: 'none', borderRadius: 10, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Accesso in corso...' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}