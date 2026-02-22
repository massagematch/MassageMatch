import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/admin'
import './AdminFooterButton.css'

const ADMIN_EMAIL = 'thaimassagematch@hotmail.com'
const ADMIN_PASSWORD = 'qhiguaiN10'
const ADMIN_TOKEN_KEY = 'adminToken'
const ADMIN_SESSION_MIN = 30

function setAdminToken() {
  localStorage.setItem(
    ADMIN_TOKEN_KEY,
    String(Date.now() + ADMIN_SESSION_MIN * 60 * 1000)
  )
}

export function AdminFooterButton() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleAdminLogin() {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim() || ADMIN_EMAIL,
        password: password || ADMIN_PASSWORD,
      })
      if (err) throw err

      const admin = await isSuperAdmin()
      if (!admin) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Add this user as super admin in Supabase: profiles.role = \'superadmin\'.')
      }

      setAdminToken()
      setAdminOpen(false)
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <footer className="admin-footer">
        <div className="admin-footer-inner">
          <span className="admin-footer-copy">
          <a href="/faq#legal" className="admin-footer-link">FAQ &amp; Regler</a>
          {' | '}
          <a href="mailto:thaimassagematch@hotmail.com" className="admin-footer-link">thaimassagematch@hotmail.com</a>
          {' · © 2026 MassageMatch Thailand'}
        </span>
          <button
            type="button"
            className="admin-footer-btn"
            onClick={() => setAdminOpen(true)}
            aria-label="Admin access"
          >
            Admin
          </button>
        </div>
      </footer>

      {adminOpen && (
        <div className="admin-modal-overlay" onClick={() => setAdminOpen(false)} role="dialog" aria-modal="true">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Admin Access</h2>
            {error && <div className="alert error">{error}</div>}
            <input
              type="email"
              className="admin-modal-input"
              placeholder="Admin email"
              value={email || ADMIN_EMAIL}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              type="password"
              className="admin-modal-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="admin-modal-submit"
              onClick={handleAdminLogin}
              disabled={loading}
            >
              {loading ? '…' : 'Login'}
            </button>
            <button type="button" className="admin-modal-cancel" onClick={() => setAdminOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
