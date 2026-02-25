import { supabase } from '@/lib/supabase'

const DEFAULT_TIMEOUT_MS = 20_000

export const CHECKOUT_TIMEOUT_MESSAGE = 'Checkout is taking too long. Please try again.'

export type CreateCheckoutBody = {
  price_id: string
  plan_type?: string
  therapist_id?: string
  salong_id?: string
  success_url?: string
  cancel_url?: string
}

/**
 * Calls create-checkout Edge Function with a timeout so the UI never hangs.
 * Rejects with CHECKOUT_TIMEOUT_MESSAGE if the request takes longer than timeoutMs.
 */
export async function invokeCreateCheckoutWithTimeout(
  body: CreateCheckoutBody,
  headers: Record<string, string> | undefined,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ data: { url?: string; error?: string } | null; error: unknown }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(CHECKOUT_TIMEOUT_MESSAGE)), timeoutMs)
  })

  const invokePromise = supabase.functions.invoke('create-checkout', {
    body,
    headers,
  })

  try {
    const result = await Promise.race([invokePromise, timeoutPromise])
    return { data: result.data, error: result.error ?? null }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    return { data: null, error: err }
  }
}
