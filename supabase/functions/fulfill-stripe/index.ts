// Idempotent fulfillment for Stripe success redirect or internal use.
// Prefer stripe-webhook for production; this can be used for success redirect handling.
import { getSupabaseService } from '../_shared/supabase.ts'

const PREMIUM_HOURS = 12
const PREMIUM_SWIPES = 10

interface Body {
  payment_id: string
  user_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  const supabase = getSupabaseService()
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const body = (await req.json()) as Body
    const { payment_id, user_id } = body
    if (!payment_id || !user_id) {
      return new Response(JSON.stringify({ error: 'payment_id and user_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { data: existing } = await supabase
      .from('logs')
      .select('id')
      .eq('event', 'stripe_fulfilled')
      .contains('payload', { payment_id })
      .limit(1)
      .single()

    if (existing) {
      return new Response(JSON.stringify({ ok: true, already_fulfilled: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const now = new Date()
    const newExpires = new Date(now.getTime() + PREMIUM_HOURS * 60 * 60 * 1000)

    const { data: profile } = await supabase
      .from('profiles')
      .select('swipes_remaining')
      .eq('user_id', user_id)
      .single()

    const newRemaining = (profile?.swipes_remaining ?? 0) + PREMIUM_SWIPES

    const { error: upsertErr } = await supabase.from('profiles').upsert(
      {
        user_id,
        access_expires: newExpires.toISOString(),
        swipes_remaining: newRemaining,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    await supabase.from('logs').insert({
      level: 'info',
      event: 'stripe_fulfilled',
      user_id,
      payload: { payment_id, expires: newExpires.toISOString(), swipes_added: PREMIUM_SWIPES },
    })

    return new Response(
      JSON.stringify({
        ok: true,
        access_expires: newExpires.toISOString(),
        swipes_remaining: newRemaining,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
