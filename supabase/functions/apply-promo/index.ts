import { getSupabaseClient } from '../_shared/supabase.ts'

const PROMO_CODE = 'NEWTHERAPIST90'
const PROMO_DURATION_DAYS = 90

interface Body {
  code: string
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
    const { code } = body
    if (!code || code.toUpperCase() !== PROMO_CODE) {
      return new Response(JSON.stringify({ error: 'Invalid promo code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, promo_used, created_at')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile.role !== 'therapist') {
      return new Response(JSON.stringify({ error: 'Promo code only for therapists' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile.promo_used) {
      return new Response(JSON.stringify({ error: 'Promo code already used' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const signupDate = new Date(profile.created_at)
    const daysSinceSignup = (Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSignup > 30) {
      return new Response(JSON.stringify({ error: 'Promo code expired (30 days from signup)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const now = new Date()
    const expires = new Date(now.getTime() + PROMO_DURATION_DAYS * 24 * 60 * 60 * 1000)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        plan_type: 'premium',
        plan_expires: expires.toISOString(),
        promo_used: true,
        visibility_score: 3,
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id)

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        plan_type: 'premium',
        plan_expires: expires.toISOString(),
        message: 'FREE 3-month Premium activated!',
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
