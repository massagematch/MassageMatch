import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useUniversalBuy } from '@/hooks/useUniversalBuy'
import { getVariant } from '@/lib/abTesting'
import { trackUnlockFunnel, trackUnlockRate } from '@/lib/analytics'
import './UnlockModal.css'

const UNLOCK_PRICE_ID = import.meta.env.VITE_STRIPE_UNLOCK_PROFILE ?? ''
const REPEAT_DISCOUNT_PERCENT = 20
const REPEAT_PRICE_THB = 39

type Therapist = { id: string; name: string; location_city?: string | null }

type Props = {
  therapist: Therapist
  isRepeat?: boolean
  onClose: () => void
}

export function UnlockModal({ therapist, isRepeat, onClose }: Props) {
  const { user } = useAuth()
  const { buyNow } = useUniversalBuy()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buttonCopy, setButtonCopy] = useState<'Unlock Now' | 'See Contacts'>('Unlock Now')

  useEffect(() => {
    if (user?.id) {
      getVariant('unlock_button', user.id).then((v) => setButtonCopy(v === 'A' ? 'Unlock Now' : 'See Contacts'))
    }
  }, [user?.id])

  useEffect(() => {
    trackUnlockRate(therapist.id, 'view')
    trackUnlockFunnel('modal_opened', { therapist_id: therapist.id })
  }, [therapist.id])

  async function handleUnlock() {
    if (!UNLOCK_PRICE_ID || !user) {
      setError('Checkout not configured')
      return
    }
    setError(null)
    setLoading(true)
    trackUnlockRate(therapist.id, 'click')
    trackUnlockFunnel('checkout_clicked', { therapist_id: therapist.id, button_copy: buttonCopy })
    try {
      trackUnlockFunnel('redirected', { therapist_id: therapist.id })
      await buyNow({
        price_id: UNLOCK_PRICE_ID,
        plan_type: 'unlock-profile',
        therapist_id: therapist.id,
        success_url: `${window.location.origin}/unlocked-profiles?success=1`,
        cancel_url: window.location.href,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
      trackUnlockFunnel('error', { therapist_id: therapist.id, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const city = therapist.location_city || 'Phuket'

  return (
    <div className="unlock-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="unlock-modal bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="unlock-modal-drag" aria-hidden />
        <h3 className="unlock-modal-title">Unlock {therapist.name}</h3>

        <div className="unlock-cro">
          <div className="unlock-progress">
            <div className="unlock-progress-bar" style={{ width: '85%' }} />
            <span className="unlock-progress-label">85% unlocked in {city}</span>
          </div>
          <p className="unlock-social-proof">1,247 unlocks this week</p>
          <p className="unlock-urgency">Unlock expires in 24h</p>
          {isRepeat && (
            <p className="unlock-repeat">Unlock again? {REPEAT_PRICE_THB} THB ({REPEAT_DISCOUNT_PERCENT}% off)</p>
          )}
        </div>

        {error && <div className="alert error">{error}</div>}
        <button
          type="button"
          className="btn-unlock swipe-to-unlock"
          onClick={handleUnlock}
          disabled={loading || !UNLOCK_PRICE_ID}
        >
          {loading ? '…' : buttonCopy}
        </button>
        <button type="button" className="unlock-modal-close" onClick={onClose} aria-label="Close">
          Cancel
        </button>
      </div>
    </div>
  )
}
