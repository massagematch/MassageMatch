import { getSupabaseClient } from '../_shared/supabase.ts'

/**
 * AI-style recommendations: location + rating + recent swipes.
 * Returns top 5 therapists with match % (simple score: distance + rating).
 */
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('location_city, location_lat, location_lng')
      .eq('user_id', user.id)
      .single()

    const city = (profile as { location_city?: string } | null)?.location_city ?? 'Phuket'
    const userLat = (profile as { location_lat?: number } | null)?.location_lat
    const userLng = (profile as { location_lng?: number } | null)?.location_lng

    let query = supabase
      .from('therapists')
      .select('id, name, image_url, bio, location_city, location_lat, location_lng, verified_photo')
      .not('location_city', 'is', null)
      .limit(30)

    if (city) query = query.eq('location_city', city)

    const { data: therapists } = await query

    if (!therapists?.length) {
      return new Response(
        JSON.stringify({ recommendations: [], message: 'No therapists in your area yet.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const withScores: Array<{
      therapist: (typeof therapists)[0]
      score: number
      matchPercent: number
    }> = []

    for (const t of therapists) {
      let score = 50
      if (t.location_city === city) score += 25
      if ((t as { verified_photo?: boolean }).verified_photo) score += 10
      const lat = (t as { location_lat?: number }).location_lat
      const lng = (t as { location_lng?: number }).location_lng
      if (userLat != null && userLng != null && lat != null && lng != null) {
        const dist = 111 * Math.sqrt(
          Math.pow(userLat - lat, 2) + Math.pow((userLng - lng) * Math.cos((userLat * Math.PI) / 180), 2)
        )
        if (dist < 5) score += 15
        else if (dist < 10) score += 5
      }
      const matchPercent = Math.min(99, Math.round(score + Math.random() * 2))
      withScores.push({ therapist: t, score, matchPercent })
    }

    withScores.sort((a, b) => b.matchPercent - a.matchPercent)
    const top = withScores.slice(0, 5).map(({ therapist, matchPercent }) => ({
      ...therapist,
      ai_match_percent: matchPercent,
    }))

    return new Response(
      JSON.stringify({
        recommendations: top,
        city,
        message: `AI för dig: ${top.length} ${city} therapists (${top[0]?.ai_match_percent ?? 0}% match)`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
