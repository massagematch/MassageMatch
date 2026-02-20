import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  })
}

export function getSupabaseService() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey)
}
