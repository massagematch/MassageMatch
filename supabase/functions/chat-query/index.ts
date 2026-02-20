import { getSupabaseClient } from '../_shared/supabase.ts'

/**
 * Parse natural language query → filters, then query therapists.
 * Example: "Phuket 5★ under 500 THB" → city: Phuket, rating_min: 5, price_max: 500
 */
function parseQuery(text: string): { city: string; rating_min: number; price_max: number | null } {
  const lower = text.toLowerCase()
  let city = 'Phuket'
  if (lower.includes('bangkok')) city = 'Bangkok'
  else if (lower.includes('phuket') || lower.includes('patong')) city = 'Phuket'
  else if (lower.includes('pattaya')) city = 'Pattaya'
  else if (lower.includes('krabi')) city = 'Krabi'
  else if (lower.includes('samui') || lower.includes('koh samui')) city = 'Koh Samui'
  let rating_min = 0
  if (/\b5\s*★|5\s*star|5\s*stars?\b/i.test(text)) rating_min = 5
  else if (/\b4\.?5|4\s*★|4\.5\s*star/i.test(text)) rating_min = 4.5
  else if (/\b4\s*★|4\s*star/i.test(text)) rating_min = 4
  let price_max: number | null = null
  const underMatch = text.match(/under\s*(\d+)|(\d+)\s*THB|max\s*(\d+)/i)
  if (underMatch) {
    const n = parseInt(underMatch[1] || underMatch[2] || underMatch[3] || '', 10)
    if (!Number.isNaN(n)) price_max = n
  }
  return { city, rating_min, price_max }
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

    const body = (await req.json()) as { query?: string }
    const queryText = (body.query ?? '').trim()
    if (!queryText) {
      return new Response(
        JSON.stringify({ error: 'query required', matches: [], message: 'Skriv t.ex. "Phuket 5★ under 500 THB"' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const { city, rating_min, price_max } = parseQuery(queryText)

    let q = supabase
      .from('therapists')
      .select('id, name, image_url, bio, location_city, location_lat, location_lng, verified_photo, prices')
      .eq('location_city', city)
      .limit(20)

    const { data: rows } = await q

    const withRating: Array<{ id: string; name: string; image_url: string | null; bio: string | null; location_city: string | null; verified_photo: boolean; prices: Record<string, number>; rating_avg: number }> = []
    for (const r of rows ?? []) {
      const { data: rev } = await supabase.rpc('therapist_rating_avg', { tid: r.id })
      const rating_avg = (rev as number) ?? 0
      if (rating_min > 0 && rating_avg < rating_min) continue
      const prices = (r.prices as Record<string, number>) ?? {}
      const thb60 = prices.thb60min ?? prices['60'] ?? null
      if (price_max != null && thb60 != null && thb60 > price_max) continue
      withRating.push({
        id: r.id,
        name: r.name,
        image_url: r.image_url,
        bio: r.bio,
        location_city: r.location_city,
        verified_photo: (r.verified_photo as boolean) ?? false,
        prices,
        rating_avg,
      })
    }

    const matches = withRating.slice(0, 5)
    const count = matches.length
    const message = count === 0
      ? `Inga match i ${city} med dina filter. Prova bredare sökning.`
      : `${count} perfekt match${count > 1 ? '' : ''} i ${city}!`

    return new Response(
      JSON.stringify({
        query: queryText,
        filters: { city, rating_min, price_max },
        matches,
        message,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Chat query failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
