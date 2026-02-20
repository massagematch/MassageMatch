import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Universal Stripe checkout: always redirect (no popup) for iOS Safari, Android, PWA.
 * Popups are blocked on iOS; redirect works everywhere.
 */
export function useUniversalBuy() {
  const buyNow = useCallback(
    async (params: {
      price_id: string
      plan_type?: string
      therapist_id?: string
      salong_id?: string
      success_url?: string
      cancel_url?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: params.price_id,
          plan_type: params.plan_type,
          therapist_id: params.therapist_id,
          salong_id: params.salong_id,
          success_url: params.success_url ?? `${window.location.origin}?success=1`,
          cancel_url: params.cancel_url ?? window.location.href,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    },
    []
  )
  return { buyNow }
}
