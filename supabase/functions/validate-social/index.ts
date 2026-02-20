import { getSupabaseService } from '../_shared/supabase.ts'

interface Body {
  platform: 'instagram' | 'telegram' | 'whatsapp' | 'line' | 'facebook'
  handle: string
}

function validateWhatsAppPhone(phone: string): { valid: boolean; exists: boolean; message: string } {
  // Thailand format: +66 followed by 8-9 digits
  const cleaned = phone.replace(/\s/g, '')
  const isValid = /^\+66\d{8,9}$/.test(cleaned)
  
  return {
    valid: isValid,
    exists: isValid, // Assume valid format = exists (can't verify without API)
    message: isValid ? 'Valid WhatsApp number ✓' : 'Enter +66 followed by 8-9 digits',
  }
}

async function checkInstagram(handle: string): Promise<{ valid: boolean; exists: boolean; message: string }> {
  const cleaned = handle.replace('@', '')
  if (!cleaned.match(/^[a-zA-Z0-9._]+$/)) {
    return { valid: false, exists: false, message: 'Invalid format. Use @username' }
  }
  
  try {
    const response = await fetch(`https://www.instagram.com/${cleaned}/?__a=1&__d=dis`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const exists = response.status === 200
    return {
      valid: exists,
      exists,
      message: exists ? 'Live profile ✓' : 'Profile not found or private',
    }
  } catch {
    return { valid: false, exists: false, message: 'Could not verify. Check format.' }
  }
}

async function checkTelegram(handle: string): Promise<{ valid: boolean; exists: boolean; message: string }> {
  let cleaned = handle.replace('@', '').replace('t.me/', '')
  if (!cleaned.match(/^[a-zA-Z0-9_]+$/)) {
    return { valid: false, exists: false, message: 'Invalid format. Use @username or t.me/username' }
  }
  
  try {
    const response = await fetch(`https://t.me/${cleaned}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const exists = response.status === 200 || response.status === 302
    return {
      valid: exists,
      exists,
      message: exists ? 'Live profile ✓' : 'Profile not found',
    }
  } catch {
    return { valid: false, exists: false, message: 'Could not verify. Check format.' }
  }
}

async function checkLine(lineId: string): Promise<{ valid: boolean; exists: boolean; message: string }> {
  if (!lineId.trim()) {
    return { valid: false, exists: false, message: 'Enter Line ID' }
  }
  
  try {
    const response = await fetch(`https://line.me/R/ti/p/~${lineId}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const exists = response.status === 200 || response.status === 302
    return {
      valid: exists,
      exists,
      message: exists ? 'Live Line profile ✓' : 'Line ID not found',
    }
  } catch {
    return { valid: true, exists: false, message: 'Format OK (could not verify)' }
  }
}

async function checkFacebook(handle: string): Promise<{ valid: boolean; exists: boolean; message: string }> {
  let cleaned = handle.replace('@', '').replace('fb.me/', '').replace('facebook.com/', '')
  if (!cleaned.trim()) {
    return { valid: false, exists: false, message: 'Enter Facebook username' }
  }
  
  try {
    const response = await fetch(`https://facebook.com/${cleaned}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const exists = response.status === 200 || response.status === 302
    return {
      valid: exists,
      exists,
      message: exists ? 'Live profile ✓' : 'Profile not found',
    }
  } catch {
    return { valid: true, exists: false, message: 'Format OK (could not verify)' }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const body = (await req.json()) as Body
    const { platform, handle } = body

    if (!platform || !handle) {
      return new Response(JSON.stringify({ error: 'platform and handle required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const supabase = getSupabaseService()

    // Check cache first
    const cacheKey = `${platform}:${handle.toLowerCase()}`
    const { data: cached } = await supabase
      .from('social_validation_cache')
      .select('valid, exists, message')
      .eq('platform', platform)
      .eq('handle', handle.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({
          valid: cached.valid,
          exists: cached.exists,
          message: cached.message || 'Cached result',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    // Validate based on platform
    let result: { valid: boolean; exists: boolean; message: string }

    switch (platform) {
      case 'instagram':
        result = await checkInstagram(handle)
        break
      case 'telegram':
        result = await checkTelegram(handle)
        break
      case 'whatsapp':
        result = validateWhatsAppPhone(handle)
        break
      case 'line':
        result = await checkLine(handle)
        break
      case 'facebook':
        result = await checkFacebook(handle)
        break
      default:
        return new Response(JSON.stringify({ error: 'Invalid platform' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
    }

    // Cache result (24h)
    await supabase.from('social_validation_cache').upsert(
      {
        platform,
        handle: handle.toLowerCase(),
        valid: result.valid,
        exists: result.exists,
        message: result.message,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'platform,handle' }
    )

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
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
