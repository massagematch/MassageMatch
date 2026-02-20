import { getSupabaseClient } from '../_shared/supabase.ts'

const DAILY_SWIPE_CAP = 5

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

    const today = new Date().toISOString().slice(0, 10)
    const { count, error: countErr } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('timestamp', `${today}T00:00:00Z`)
      .lt('timestamp', `${today}T23:59:59.999Z`)

    if (countErr) {
      return new Response(JSON.stringify({ error: countErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const allowed = Math.max(0, DAILY_SWIPE_CAP - (count ?? 0))
    return new Response(
      JSON.stringify({
        swipes_today: count ?? 0,
        daily_cap: DAILY_SWIPE_CAP,
        allowed_remaining: allowed,
        ok: (count ?? 0) < DAILY_SWIPE_CAP,
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
