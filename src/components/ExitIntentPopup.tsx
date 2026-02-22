import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useABTest } from '@/hooks/useABTest'
import './ExitIntentPopup.css'

const DISCOUNT_CODE = 'EXIT20'
const DISCOUNT_PERCENT = 20

export function ExitIntentPopup() {
  const { user, profile } = useAuth()
  const abVariant = useABTest(user?.id)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const priceId = abVariant === 'B'
    ? (import.meta.env.VITE_STRIPE_UNLIMITED_12H_79 ?? import.meta.env.VITE_STRIPE_UNLIMITED_12H)
    : import.meta.env.VITE_STRIPE_UNLIMITED_12H

  useEffect(() => {
    if (dismissed || !user || profile?.plan_expires) return // Don't show if already has plan

    let mouseY = 0
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !show) {
        setShow(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [show, dismissed, user, profile])

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

  if (!show) return null

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
            <Link to="/pricing" className="exit-intent-pricing-link" onClick={() => setShow(false)}>
              Go to Pricing →
            </Link>
          </div>
        )}
        <button
          type="button"
          className="exit-intent-cta"
          onClick={handleClaimDiscount}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : `Claim ${DISCOUNT_PERCENT}% Discount`}
        </button>
        <p className="exit-intent-code">Use code {DISCOUNT_CODE} or FIRST20 at checkout</p>
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
