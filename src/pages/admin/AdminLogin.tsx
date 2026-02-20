import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/admin'
import './AdminLogin.css'

const SUPERADMIN_EMAIL = 'thaimassagematch@hotmail.com'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      
      const isAdmin = await isSuperAdmin()
      if (!isAdmin) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Super admin only.')
      }
      
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>🔐 Super Admin</h1>
        <p className="subtitle">MassageMatch Thailand</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? '…' : 'Login'}
          </button>
        </form>
        <p className="hint">Super admin: {SUPERADMIN_EMAIL}</p>
      </div>
    </div>
  )
}
