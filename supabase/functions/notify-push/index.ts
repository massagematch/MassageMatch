/**
 * Send Web Push to a user (e.g. "Ny like! Anna 1.8km Phuket").
 * Requires: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY in Edge Function secrets.
 * Body: { target_user_id: string, title: string, body: string }
 * Caller must be authenticated (Bearer token).
 */
import { getSupabaseClient, getSupabaseService } from '../_shared/supabase.ts'

const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')

interface Body {
  target_user_id: string
  title: string
  body: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  try {
    const body = (await req.json()) as Body
    const { target_user_id, title, body: bodyText } = body
    if (!target_user_id || !title) {
      return new Response(JSON.stringify({ error: 'target_user_id and title required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    const authClient = getSupabaseClient(req)
    const { data: { user }, error: authErr } = await authClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    const supabase = getSupabaseService()
    const { data: row, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', target_user_id)
      .maybeSingle()
    if (subErr || !row?.subscription) {
      return new Response(JSON.stringify({ received: true, sent: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    const mod = await import('https://esm.sh/web-push@3.6.7?target=deno')
    const webPush = mod.default ?? mod
    webPush.setVapidDetails(
      'mailto:thaimassagematch@hotmail.com',
      vapidPublic,
      vapidPrivate
    )
    const payload = JSON.stringify({ title, body: bodyText ?? '' })
    await webPush.sendNotification(row.subscription as Parameters<typeof webPush.sendNotification>[0], payload)
    return new Response(JSON.stringify({ received: true, sent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    console.error('notify-push error', e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Send failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
