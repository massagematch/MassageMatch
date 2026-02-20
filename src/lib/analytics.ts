// PostHog and analytics integration

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void
      identify: (userId: string, properties?: Record<string, unknown>) => void
      reset: () => void
    }
  }
}

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

export function initAnalytics() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return

  // Load PostHog script
  const script = document.createElement('script')
  script.src = `${POSTHOG_HOST}/static/array.js`
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    if (window.posthog) {
      window.posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
      })
    }
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (window.posthog) {
    window.posthog.capture(event, properties)
  }
  
  // Also log to Supabase logs table
  if (typeof window !== 'undefined') {
    // This would be called from a component with auth context
    console.log('Track:', event, properties)
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (window.posthog) {
    window.posthog.identify(userId, properties)
  }
}

export function trackStripeFunnel(step: string, properties?: Record<string, unknown>) {
  trackEvent('stripe_funnel', { step, ...properties })
}

export function trackSwipe(action: 'like' | 'pass', therapistId: string) {
  trackEvent('swipe', { action, therapist_id: therapistId })
}

export function trackConversion(type: string, value: number) {
  trackEvent('conversion', { type, value })
}

export function trackUnlockFunnel(step: string, properties?: Record<string, unknown>) {
  trackEvent('unlock_funnel', { step, ...properties })
}

export function trackUnlockRate(therapistId: string, action: 'view' | 'click' | 'payment') {
  trackEvent('unlock_rate', { therapist_id: therapistId, action })
}
