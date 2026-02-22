import { getSupabaseClient } from '../_shared/supabase.ts'

const FREE_3MONTH_CODE = 'NEWTHERAPIST90'

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

    const body = (await req.json()) as { code?: string }
    const code = (body?.code ?? '').trim().toUpperCase()
    if (!code) {
      return new Response(JSON.stringify({ error: 'Code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, promo_used')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile.role !== 'therapist') {
      return new Response(JSON.stringify({ error: 'This promo is for therapists/freelancers only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile.promo_used) {
      return new Response(JSON.stringify({ error: 'You have already used a promo code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (code !== FREE_3MONTH_CODE) {
      const { data: discount } = await supabase
        .from('discount_codes')
        .select('id, discount_type, discount_value, plan_type, active, expires_at')
        .eq('code', code)
        .maybeSingle()

      if (!discount || !discount.active) {
        return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Code has expired' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
      if (discount.plan_type !== 'premium' || discount.discount_type !== 'free_months') {
        return new Response(JSON.stringify({ error: 'This code is not valid for therapist free months' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        plan_type: 'premium',
        plan_expires: expiresAt.toISOString(),
        promo_used: true,
        visibility_score: 3,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    await supabase.from('therapists').upsert(
      { id: user.id, name: user.email?.split('@')[0] ?? 'Therapist' },
      { onConflict: 'id' }
    )

    return new Response(
      JSON.stringify({ success: true, message: 'FREE 3-month Premium activated. You now appear in swipe/search. Timer on Profile.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to apply promo' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
