// Auth webhook: auto-confirm therapist/freelance and salong on signup.
// Configure Database Webhook: Supabase Dashboard → Database → Webhooks
//   Table: profiles, Events: INSERT, URL: https://<project>.supabase.co/functions/v1/auth-webhook
// When a profile with role=therapist or role=salong is inserted, we confirm the user's email.
import { getSupabaseService } from '../_shared/supabase.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const payload = await req.json() as {
      type?: string
      table?: string
      schema?: string
      record?: { user_id?: string; role?: string }
      user?: { id: string; user_metadata?: { role?: string } }
    }
    let userId: string | null = null
    let role: string | undefined

    // Database webhook on profiles INSERT
    if (payload.type === 'INSERT' && payload.table === 'profiles' && payload.record) {
      userId = payload.record.user_id ?? null
      role = payload.record.role
    }
    // Auth webhook (user.created) - fallback if configured
    if (!userId && payload.type === 'user.created' && payload.user) {
      userId = payload.user.id
      role = payload.user.user_metadata?.role
    }

    if (userId && (role === 'therapist' || role === 'salong')) {
      const supabase = getSupabaseService()
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      })
      if (error) console.error('auth-webhook updateUserById:', error)
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error('auth-webhook:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
