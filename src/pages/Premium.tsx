import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AccessTimer } from '@/components/AccessTimer'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import { invokeCreateCheckoutWithTimeout } from '@/lib/checkout'
import './Premium.css'

const PREMIUM_PRICE_ID = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID ?? ''

export default function Premium() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!user?.id) {
      navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.PREMIUM } })
      return
    }
    if (!PREMIUM_PRICE_ID) {
      setError('Checkout not configured')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await invokeCreateCheckoutWithTimeout(
        {
          price_id: PREMIUM_PRICE_ID,
          success_url: `${window.location.origin}/premium?success=1`,
          cancel_url: `${window.location.origin}/premium`,
        },
        session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
      )
      if (fnErr) throw fnErr
      if (data?.url) {
        window.location.assign(data.url)
        return
      }
      if (data?.error) throw new Error(data.error)
      else setError('No checkout URL returned')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      if (msg === 'REGISTER_FIRST' || msg.includes('Unauthorized') || msg.includes('Register') || msg.includes('profile')) {
        navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.PREMIUM } })
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const accessExpires = profile?.access_expires ? new Date(profile.access_expires) : null
  const hasActiveAccess = accessExpires != null && accessExpires > new Date()

  return (
    <div className="premium-page">
      <h1>Premium — 12h access</h1>
      <p className="muted">Get 12 hours of premium access plus 10 extra swipes.</p>
      <AccessTimer />
      {hasActiveAccess && (
        <p className="success-msg">Your premium is active. Use your extra swipes on the Swipe page.</p>
      )}
      {error && <div className="alert error">{error}</div>}
      <button
        type="button"
        className="btn-premium"
        onClick={handleCheckout}
        disabled={loading || !PREMIUM_PRICE_ID || !user?.id}
      >
        {loading ? 'Redirecting…' : 'Buy 12h Premium'}
      </button>
    </div>
  )
}
