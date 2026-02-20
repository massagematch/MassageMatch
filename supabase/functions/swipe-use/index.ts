import { getSupabaseClient } from '../_shared/supabase.ts'

const DAILY_FREE_CAP = 5

interface Body {
  therapist_id: string
  action: 'like' | 'pass'
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
    const { therapist_id, action } = body
    if (!therapist_id || !action || !['like', 'pass'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid therapist_id or action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('swipes_remaining, swipes_used, access_expires')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const accessExpires = profile.access_expires ? new Date(profile.access_expires) : null
    const hasPremium = accessExpires != null && accessExpires > new Date()
    const remaining = profile.swipes_remaining ?? 0

    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'No swipes remaining. Daily cap is 5 free; get more with Premium.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    const { error: swipeInsertErr } = await supabase.from('swipes').insert({
      user_id: user.id,
      therapist_id,
      action,
    })
    if (swipeInsertErr) {
      return new Response(JSON.stringify({ error: swipeInsertErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        swipes_remaining: remaining - 1,
        swipes_used: (profile.swipes_used ?? 0) + 1,
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
        swipes_remaining: remaining - 1,
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
