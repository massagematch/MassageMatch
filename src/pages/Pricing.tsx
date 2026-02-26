import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@/contexts/AuthContext'
import { PlanTimer } from '@/components/PlanTimer'
import { PromoCodeInput } from '@/components/PromoCodeInput'
import { supabase } from '@/lib/supabase'
import { getVariant } from '@/lib/abTesting'
import { trackStripeFunnel } from '@/lib/analytics'
import { ROUTES } from '@/constants/routes'
import { invokeCreateCheckoutWithTimeout } from '@/lib/checkout'
import './Pricing.css'

const CANONICAL_PRICING = 'https://massagematchthai.com/pricing'

// Stripe Price IDs (set in env)
const PRICE_IDS = {
  customer: {
    unlockProfile: import.meta.env.VITE_STRIPE_UNLOCK_PROFILE ?? '',
    unlimited12h: import.meta.env.VITE_STRIPE_UNLIMITED_12H ?? '',
  },
  therapist: {
    premium1m: import.meta.env.VITE_STRIPE_THERAPIST_PREMIUM_1M ?? '',
    premium3m: import.meta.env.VITE_STRIPE_THERAPIST_PREMIUM_3M ?? '',
    boostSwipe6h: import.meta.env.VITE_STRIPE_BOOST_SWIPE_6H ?? '',
    boostSearch24h: import.meta.env.VITE_STRIPE_BOOST_SEARCH_24H ?? '',
  },
  salong: {
    premium1m: import.meta.env.VITE_STRIPE_SALONG_PREMIUM_1M ?? '',
    toplist7d: import.meta.env.VITE_STRIPE_SALONG_TOPLIST_7D ?? '',
  },
}

export default function Pricing() {
  const navigate = useNavigate()
  const { user, profile, refetchProfile } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pricingVariant, setPricingVariant] = useState<'A' | 'B'>('A')
  const role = profile?.role ?? 'customer'

  useEffect(() => {
    if (user?.id) {
      getVariant('pricing', user.id).then((v) => setPricingVariant((v === 'B' ? 'B' : 'A') as 'A' | 'B'))
    }
  }, [user?.id])

  async function handleCheckout(planType: string, priceId: string, therapistId?: string, salongId?: string) {
    if (!user?.id) {
      navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.PRICING } })
      return
    }
    if (!priceId) {
      setError('Checkout not configured')
      return
    }
    setError(null)
    setLoading(planType)
    trackStripeFunnel('checkout_initiated', { plan_type: planType, variant: pricingVariant })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await invokeCreateCheckoutWithTimeout(
        {
          price_id: priceId,
          plan_type: planType,
          therapist_id: therapistId,
          salong_id: salongId,
          success_url: `${window.location.origin}/pricing?success=1`,
          cancel_url: `${window.location.origin}/pricing`,
        },
        session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
      )
      if (fnErr) throw fnErr
      if (data?.url) {
        trackStripeFunnel('checkout_redirected', { plan_type: planType })
        window.location.assign(data.url)
        return
      }
      if (data?.error) throw new Error(data.error)
      else setError('No checkout URL returned')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Checkout failed'
      trackStripeFunnel('checkout_error', { plan_type: planType, error: msg })
      if (msg === 'REGISTER_FIRST' || msg.includes('Unauthorized') || msg.includes('Register') || msg.includes('profile')) {
        navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.PRICING } })
        return
      }
      setError(msg)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>Pricing | MassageMatch Thailand</title>
        <meta
          name="description"
          content="View MassageMatch Thailand pricing: unlock profiles, 12h unlimited, therapist and salong plans."
        />
        <link rel="canonical" href={CANONICAL_PRICING} />
        <meta property="og:title" content="Pricing | MassageMatch Thailand" />
        <meta property="og:url" content={CANONICAL_PRICING} />
      </Helmet>
      <div className="pricing-page">
      <h1>Pricing Plans</h1>
      {error && <div className="alert error">{error}</div>}
      {window.location.search.includes('success=1') && (
        <div className="alert success">Payment successful! Your plan is being activated...</div>
      )}

      {role === 'customer' && (
        <div className="pricing-section">
          <h2>Customer Plans</h2>
          <div className="plans-grid">
            <div className="plan-card">
              <h3>Unlock Profile</h3>
              <div className="plan-price">49 THB</div>
              <p className="plan-desc">Unlock 1 therapist/freelance or salong + direct contact</p>
              <p className="plan-duration">Duration: 1 hour</p>
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('unlock-profile', PRICE_IDS.customer.unlockProfile)}
                disabled={loading === 'unlock-profile' || !PRICE_IDS.customer.unlockProfile || !user?.id}
              >
                {loading === 'unlock-profile' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
            <div className="plan-card featured">
              <h3>12h Unlimited</h3>
              <div className="plan-price">199 THB</div>
              <p className="plan-desc">Unlimited swipes/profiles</p>
              <p className="plan-duration">Duration: 12 hours</p>
              <PlanTimer type="plan" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('12h-unlimited', PRICE_IDS.customer.unlimited12h)}
                disabled={loading === '12h-unlimited' || !PRICE_IDS.customer.unlimited12h || !user?.id}
              >
                {loading === '12h-unlimited' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'therapist' && (
        <div className="pricing-section">
          <h2>Therapist/Freelance Plans</h2>
          <PromoCodeInput onSuccess={refetchProfile} />
          <div className="plans-grid">
            <div className="plan-card">
              <h3>Therapist/Freelance Premium 1 Month</h3>
              <div className="plan-price">99 THB/mo</div>
              <p className="plan-desc">Toplist + search + swipe priority</p>
              <p className="plan-duration">Duration: 30 days</p>
              <PlanTimer type="plan" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('therapist-premium-1m', PRICE_IDS.therapist.premium1m)}
                disabled={loading === 'therapist-premium-1m' || !PRICE_IDS.therapist.premium1m || !user?.id}
              >
                {loading === 'therapist-premium-1m' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
            <div className="plan-card">
              <h3>Therapist/Freelance Premium 3 Months</h3>
              <div className="plan-price">269 THB/mo</div>
              <p className="plan-desc">Toplist + search + swipe priority</p>
              <p className="plan-duration">Duration: 90 days</p>
              <PlanTimer type="plan" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('therapist-premium-3m', PRICE_IDS.therapist.premium3m)}
                disabled={loading === 'therapist-premium-3m' || !PRICE_IDS.therapist.premium3m || !user?.id}
              >
                {loading === 'therapist-premium-3m' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
            <div className="plan-card">
              <h3>Boost 5X Swipe-Mode</h3>
              <div className="plan-price">199 THB</div>
              <p className="plan-desc">5x swipe visibility</p>
              <p className="plan-duration">Duration: 6 hours</p>
              <PlanTimer type="boost" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('boost-swipe-6h', PRICE_IDS.therapist.boostSwipe6h)}
                disabled={loading === 'boost-swipe-6h' || !PRICE_IDS.therapist.boostSwipe6h || !user?.id}
              >
                {loading === 'boost-swipe-6h' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
            <div className="plan-card">
              <h3>Boost 24h Top Search</h3>
              <div className="plan-price">149 THB</div>
              <p className="plan-desc">#1 search position</p>
              <p className="plan-duration">Duration: 24 hours</p>
              <PlanTimer type="boost" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('boost-search-24h', PRICE_IDS.therapist.boostSearch24h)}
                disabled={loading === 'boost-search-24h' || !PRICE_IDS.therapist.boostSearch24h || !user?.id}
              >
                {loading === 'boost-search-24h' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'salong' && (
        <div className="pricing-section">
          <h2>Salong Plans</h2>
          <div className="plans-grid">
            <div className="plan-card">
              <h3>Premium 1 Month</h3>
              <div className="plan-price">199 THB/mo</div>
              <p className="plan-desc">Toplist + search priority</p>
              <p className="plan-duration">Duration: 30 days</p>
              <PlanTimer type="plan" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('salong-premium-1m', PRICE_IDS.salong.premium1m)}
                disabled={loading === 'salong-premium-1m' || !PRICE_IDS.salong.premium1m || !user?.id}
              >
                {loading === 'salong-premium-1m' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
            <div className="plan-card featured">
              <h3>Top List 7 Days</h3>
              <div className="plan-price">499 THB</div>
              <p className="plan-desc">#1 salong toplist</p>
              <p className="plan-duration">Duration: 7 days</p>
              <PlanTimer type="boost" />
              <button
                type="button"
                className="btn-plan"
                onClick={() => handleCheckout('salong-toplist-7d', PRICE_IDS.salong.toplist7d)}
                disabled={loading === 'salong-toplist-7d' || !PRICE_IDS.salong.toplist7d || !user?.id}
              >
                {loading === 'salong-toplist-7d' ? 'Redirecting…' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
