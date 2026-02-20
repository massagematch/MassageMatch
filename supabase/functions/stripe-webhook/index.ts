import { getSupabaseService } from '../_shared/supabase.ts'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!webhookSecret || !sig) {
    return new Response('Webhook secret missing', { status: 500 })
  }

  let event: { id: string; type: string; data: { object: Record<string, unknown> } }
  try {
    const stripe = await import('https://esm.sh/stripe@14?target=deno')
    const stripeClient = new stripe.Stripe(stripeSecret!, {
      apiVersion: '2023-10-16',
      httpClient: stripe.fetchHttpClient,
    })
    event = stripeClient.webhooks.constructEvent(raw, sig, webhookSecret) as typeof event
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e}`, { status: 400 })
  }

  const supabase = getSupabaseService()

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as { id?: string }
    if (charge.id) {
      await supabase.from('unlocked_profiles').delete().eq('stripe_charge_id', charge.id)
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id?: string
      payment_status?: string
      customer_email?: string
      client_reference_id?: string
      metadata?: Record<string, string>
    }
    const paymentId = session.id
    if (!paymentId) {
      return new Response('No session id', { status: 400 })
    }
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: alreadyFulfilled } = await supabase
      .from('logs')
      .select('id')
      .eq('event', 'stripe_fulfilled')
      .contains('payload', { payment_id: paymentId })
      .limit(1)
      .maybeSingle()
    if (alreadyFulfilled) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = session.metadata?.user_id ?? session.client_reference_id
    const planType = session.metadata?.plan_type ?? ''
    if (!userId) {
      await supabase.from('logs').insert({
        level: 'error',
        event: 'stripe_fulfill_no_user',
        payload: { session_id: paymentId },
      })
      return new Response('No user_id in session', { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, swipes_remaining, plan_expires, boost_expires')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    let updateData: Record<string, unknown> = { updated_at: now.toISOString() }

    // Handle all plan types
    switch (planType) {
      case 'unlock-profile': {
        const therapistId = session.metadata?.therapist_id
        const salongId = session.metadata?.salong_id
        if (therapistId || salongId) {
          const { data: existingUnlock } = await supabase
            .from('unlocked_profiles')
            .select('id')
            .eq('stripe_payment_id', paymentId)
            .maybeSingle()
          if (existingUnlock) break
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h
          await supabase.from('unlocked_profiles').insert({
            user_id: userId,
            therapist_id: therapistId || null,
            salong_id: salongId || null,
            expires_at: expiresAt.toISOString(),
            stripe_payment_id: paymentId,
          })
          const stripe = await import('https://esm.sh/stripe@14?target=deno')
          const stripeClient = new stripe.Stripe(stripeSecret!, {
            apiVersion: '2023-10-16',
            httpClient: stripe.fetchHttpClient,
          })
          const sessionExpanded = await stripeClient.checkout.sessions.retrieve(paymentId, {
            expand: ['payment_intent'],
          })
          const pi = sessionExpanded.payment_intent as { latest_charge?: string } | null
          if (pi?.latest_charge) {
            await supabase.from('unlocked_profiles').update({ stripe_charge_id: pi.latest_charge }).eq('stripe_payment_id', paymentId)
          }
        }
        break
      }

      case '12h-unlimited': {
        updateData.plan_type = 'unlimited'
        updateData.plan_expires = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
        updateData.swipes_remaining = (profile?.swipes_remaining ?? 0) + 10
        break
      }

      case 'therapist-premium-1m': {
        updateData.plan_type = 'premium'
        updateData.plan_expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        updateData.visibility_score = 3
        break
      }

      case 'therapist-premium-3m': {
        updateData.plan_type = 'premium'
        updateData.plan_expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        updateData.visibility_score = 3
        break
      }

      case 'boost-swipe-6h': {
        updateData.boost_expires = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
        updateData.visibility_score = 5
        break
      }

      case 'boost-search-24h': {
        updateData.boost_expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        updateData.visibility_score = 10
        break
      }

      case 'salong-premium-1m': {
        const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        updateData.plan_type = 'premium'
        updateData.plan_expires = expires.toISOString()
        updateData.visibility_score = 3
        // Also update salongs table
        await supabase
          .from('salongs')
          .update({
            plan_type: 'premium',
            plan_expires: expires.toISOString(),
            visibility_score: 3,
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId)
        break
      }

      case 'salong-toplist-7d': {
        const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        updateData.boost_expires = expires.toISOString()
        updateData.visibility_score = 10
        await supabase
          .from('salongs')
          .update({
            boost_expires: expires.toISOString(),
            visibility_score: 10,
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId)
        break
      }

      default: {
        // Legacy: 12h premium (backward compat)
        updateData.access_expires = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
        updateData.swipes_remaining = (profile?.swipes_remaining ?? 0) + 10
        break
      }
    }

    const { error: upsertErr } = await supabase.from('profiles').upsert(
      {
        user_id: userId,
        ...updateData,
      },
      { onConflict: 'user_id' }
    )

    if (upsertErr) {
      await supabase.from('logs').insert({
        level: 'error',
        event: 'stripe_fulfill_upsert_failed',
        user_id: userId,
        payload: { error: upsertErr.message, payment_id: paymentId, plan_type },
      })
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('logs').insert({
      level: 'info',
      event: 'stripe_fulfilled',
      user_id: userId,
      payload: { payment_id: paymentId, plan_type, ...updateData },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
