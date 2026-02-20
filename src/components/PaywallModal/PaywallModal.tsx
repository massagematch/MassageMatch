import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUniversalBuy } from '@/hooks/useUniversalBuy'
import './PaywallModal.css'

const UNLIMITED_PRICE_ID = import.meta.env.VITE_STRIPE_UNLIMITED_12H ?? ''

export type PaywallMode = 'signup' | 'login' | 'premium'

type Props = {
  open: boolean
  onClose: () => void
  mode?: PaywallMode
}

const BENEFITS = [
  'Unlimited swipes',
  'Chat verified therapists',
  "See who's nearby",
  'Top list priority',
]

export function PaywallModal({ open, onClose, mode = 'signup' }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { buyNow } = useUniversalBuy()

  if (!open) return null

  async function handleUnlimited() {
    if (!UNLIMITED_PRICE_ID || !user?.id) {
      navigate('/pricing')
      onClose()
      return
    }
    try {
      await buyNow({
        price_id: UNLIMITED_PRICE_ID,
        plan_type: '12h-unlimited',
        success_url: `${window.location.origin}/swipe?success=1`,
        cancel_url: window.location.href,
      })
    } catch {
      navigate('/pricing')
      onClose()
    }
  }

  function handleSignup() {
    onClose()
    navigate('/login')
  }

  function handleLogin() {
    onClose()
    navigate('/login')
  }

  return (
    <div className="paywall-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="paywall-close" onClick={onClose} aria-label="Close">×</button>
        <div className="paywall-icon-wrap">
          <span className="paywall-icon" aria-hidden>🔒</span>
        </div>
        <h2 id="paywall-title" className="paywall-title">Unlock Phuket&apos;s Best</h2>
        <p className="paywall-desc">See full profiles & swipe unlimited</p>

        <div className="paywall-ctas">
          <button type="button" className="paywall-btn paywall-btn-primary" onClick={handleSignup}>
            🚀 Start Free Trial (3 swipes)
          </button>
          <button
            type="button"
            className="paywall-btn paywall-btn-outline"
            onClick={user?.id ? handleUnlimited : handleSignup}
          >
            💎 Unlimited 12h ฿199
          </button>
        </div>

        <div className="paywall-benefits">
          {BENEFITS.map((b) => (
            <div key={b} className="paywall-benefit">
              <span className="paywall-check">✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        <button type="button" className="paywall-login" onClick={handleLogin}>
          👤 Already have account? Login
        </button>
      </div>
    </div>
  )
}
