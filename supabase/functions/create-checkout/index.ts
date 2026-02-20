import { getSupabaseClient } from '../_shared/supabase.ts'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

interface Body {
  price_id: string
  plan_type?: string
  therapist_id?: string
  salong_id?: string
  success_url?: string
  cancel_url?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  try {
    const supabase = getSupabaseClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const body = (await req.json()) as Body
    const { price_id, plan_type, therapist_id, salong_id, success_url, cancel_url } = body
    if (!price_id) {
      return new Response(JSON.stringify({ error: 'price_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (plan_type === 'unlock-profile') {
      const { data: profile } = await supabase.from('profiles').select('plan_expires, access_expires').eq('user_id', user.id).single()
      const planExpires = profile?.plan_expires ? new Date(profile.plan_expires) : null
      const accessExpires = profile?.access_expires ? new Date(profile.access_expires) : null
      const hasActivePlan = (planExpires != null && planExpires > new Date()) || (accessExpires != null && accessExpires > new Date())
      if (!hasActivePlan) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count } = await supabase.from('unlocked_profiles').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('unlocked_at', since)
        if ((count ?? 0) >= 20) {
          return new Response(JSON.stringify({ error: 'Max 20 unlocks per day for free accounts. Upgrade for more.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          })
        }
      }
    }

    const stripe = await import('https://esm.sh/stripe@14?target=deno')
    const stripeClient = new stripe.Stripe(stripeSecret, {
      apiVersion: '2023-10-16',
      httpClient: stripe.fetchHttpClient,
    })

    const metadata: Record<string, string> = { user_id: user.id }
    if (plan_type) metadata.plan_type = plan_type
    if (therapist_id) metadata.therapist_id = therapist_id
    if (salong_id) metadata.salong_id = salong_id

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${appUrl}/pricing?success=1`,
      cancel_url: cancel_url || `${appUrl}/pricing`,
      client_reference_id: user.id,
      metadata,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Checkout failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
