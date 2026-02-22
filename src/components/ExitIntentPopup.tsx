import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import './ExitIntentPopup.css'

const DISCOUNT_CODE = 'EXIT20'
const DISCOUNT_PERCENT = 20

export function ExitIntentPopup() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

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
    const priceId = import.meta.env.VITE_STRIPE_UNLIMITED_12H
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
      setError(e instanceof Error ? e.message : 'Checkout failed')
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
        <h2>Wait! 🎁</h2>
        <p className="exit-intent-discount">{DISCOUNT_PERCENT}% OFF Your First Purchase</p>
        <p className="exit-intent-text">
          Get 12 hours of unlimited swipes for just <strong>159 THB</strong> (was 199 THB)
        </p>
        {error && <p className="exit-intent-error">{error}</p>}
        <button
          type="button"
          className="exit-intent-cta"
          onClick={handleClaimDiscount}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : `Claim ${DISCOUNT_PERCENT}% Discount`}
        </button>
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
