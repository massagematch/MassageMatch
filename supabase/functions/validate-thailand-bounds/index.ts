const PHUKET_BOUNDS = { latMin: 7.7, latMax: 8.2, lngMin: 98.2, lngMax: 98.5 }
const THAILAND_BOUNDS = { latMin: 5.5, latMax: 21, lngMin: 97, lngMax: 106 }

interface Body {
  lat: number
  lng: number
  region?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const body = (await req.json()) as Body
    const { lat, lng, region } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const inThailand =
      lat >= THAILAND_BOUNDS.latMin &&
      lat <= THAILAND_BOUNDS.latMax &&
      lng >= THAILAND_BOUNDS.lngMin &&
      lng <= THAILAND_BOUNDS.lngMax

    const inPhuket =
      lat >= PHUKET_BOUNDS.latMin &&
      lat <= PHUKET_BOUNDS.latMax &&
      lng >= PHUKET_BOUNDS.lngMin &&
      lng <= PHUKET_BOUNDS.lngMax

    const valid = inThailand
    const suggestedRegion = inPhuket ? 'Southern' : inThailand ? 'Central' : null

    return new Response(
      JSON.stringify({
        valid,
        in_phuket: inPhuket,
        suggested_region: suggestedRegion,
        message: valid
          ? 'Location within Thailand ✓'
          : 'Location outside Thailand. Please set a Thailand location.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Validation failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
