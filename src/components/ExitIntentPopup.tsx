import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useABTest } from '@/hooks/useABTest'
import { ROUTES } from '@/constants/routes'
import './ExitIntentPopup.css'

const DISCOUNT_CODE = 'EXIT20'
const DISCOUNT_PERCENT = 20
const EXIT_INTENT_SESSION_KEY = 'exitIntentShownLogin'

export function ExitIntentPopup() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const abVariant = useABTest(user?.id)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const triggeredRef = useRef(false)
  const priceId = abVariant === 'B'
    ? (import.meta.env.VITE_STRIPE_UNLIMITED_12H_79 ?? import.meta.env.VITE_STRIPE_UNLIMITED_12H)
    : import.meta.env.VITE_STRIPE_UNLIMITED_12H

  // Only show exit-intent when user is ON the registration (login) page and tries to leave
  const isLoginPage = location.pathname === ROUTES.LOGIN

  useEffect(() => {
    if (!isLoginPage) return
    if (dismissed) return
    if (user && profile?.plan_expires && new Date(profile.plan_expires) > new Date()) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(EXIT_INTENT_SESSION_KEY) === '1') return
    if (triggeredRef.current) return

    const trigger = () => {
      if (triggeredRef.current) return
      triggeredRef.current = true
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, '1')
      setShow(true)
    }

    // Trigger when user switches tab or minimises (actually leaving the page)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') trigger()
    }

    // Fallback: mouse leaves viewport upward (desktop only, strict threshold)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isLoginPage, dismissed, user, profile])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClaimDiscount() {
    if (!priceId || !user) {
      setError('Checkout not configured')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: priceId,
          plan_type: '12h-unlimited',
          success_url: `${window.location.origin}/pricing?discount=${DISCOUNT_CODE}`,
          cancel_url: `${window.location.origin}/pricing`,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })
      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)
      if (data?.url) {
        window.location.assign(data.url)
        return
      }
      throw new Error('No checkout URL returned')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      const isEdgeFnError = /edge function|failed to send|network|fetch/i.test(String(msg))
      setError(
        isEdgeFnError
          ? `Checkout service unavailable. Go to Pricing and use code ${DISCOUNT_CODE} (or FIRST20) at checkout.`
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  if (!show || !isLoginPage) return null

  return (
    <div className="exit-intent-overlay" onClick={() => setShow(false)}>
      <div className="exit-intent-popup" onClick={(e) => e.stopPropagation()}>
        <button className="exit-intent-close" onClick={() => setShow(false)}>
          ×
        </button>
        <h2>Top freelancers väntar! 🎁</h2>
        <p className="exit-intent-discount">{DISCOUNT_PERCENT}% OFF Your First Purchase</p>
        <p className="exit-intent-text">
          Get 12 hours of unlimited swipes for just <strong>{abVariant === 'B' ? '79' : '99'} THB</strong> (limited offer)
        </p>
        {error && (
          <div className="exit-intent-error-wrap">
            <p className="exit-intent-error">{error}</p>
            <Link to={ROUTES.PRICING} className="exit-intent-pricing-link" onClick={() => setShow(false)}>
              Go to Pricing →
            </Link>
          </div>
        )}
        {user ? (
          <>
            <button
              type="button"
              className="exit-intent-cta"
              onClick={handleClaimDiscount}
              disabled={loading}
            >
              {loading ? 'Redirecting…' : `Claim ${DISCOUNT_PERCENT}% Discount`}
            </button>
            <p className="exit-intent-code">Use code {DISCOUNT_CODE} or FIRST20 at checkout</p>
          </>
        ) : (
          <p className="exit-intent-text">Register below to get {DISCOUNT_PERCENT}% off your first purchase.</p>
        )}
        <button className="exit-intent-dismiss" onClick={() => {
          setDismissed(true)
          setShow(false)
        }}>
          No thanks
        </button>
      </div>
    </div>
  )
}
