import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or anon key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Profile = {
  user_id: string
  role: 'customer' | 'therapist' | 'salong'
  swipes_remaining: number
  swipes_used: number
  access_expires: string | null
  plan_type: string | null
  plan_expires: string | null
  boost_expires: string | null
  promo_used: boolean
  visibility_score: number
  hotel_discounts: boolean
  social_links?: Record<string, string> | null
  social_validation?: Record<string, { valid: boolean; exists?: boolean; message: string }> | null
  location_region?: string | null
  location_city?: string | null
  location_area?: string | null
  location_lat?: number | null
  location_lng?: number | null
  share_location?: boolean
  created_at: string
  updated_at: string
}

export type Swipe = {
  id: string
  user_id: string
  therapist_id: string
  action: string
  timestamp: string
}
