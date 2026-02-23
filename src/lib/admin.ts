import { supabase } from './supabase'

export async function isSuperAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  return data?.role === 'superadmin'
}

export async function checkSuperAdmin(): Promise<boolean> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Super admin access required')
  }
  return true
}

export type AdminStats = {
  revenue_today: number
  revenue_week: number
  revenue_month: number
  active_users: number
  active_customers: number
  active_therapists: number
  active_salongs: number
  new_signups_24h: number
  pending_reviews: number
  boosts_active: number
}

export async function getAdminStats(): Promise<AdminStats> {
  await checkSuperAdmin()
  // This would typically query Stripe API and DB
  // For now, return mock structure - implement with real queries
  const { data: profiles } = await supabase.from('profiles').select('role, created_at, boost_expires, banned')
  const { data: reviews } = await supabase.from('reviews').select('id').eq('approved', false)
  
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  type ProfileRow = { role: string; created_at: string; boost_expires?: string | null; banned?: boolean }
  const activeUsers = (profiles as ProfileRow[] | null)?.filter(p => !p.banned).length ?? 0
  const newSignups = (profiles as ProfileRow[] | null)?.filter(p => new Date(p.created_at) > yesterday).length ?? 0
  const activeBoosts = (profiles as ProfileRow[] | null)?.filter(p =>
    p.boost_expires && new Date(p.boost_expires) > now
  ).length ?? 0
  
  return {
    revenue_today: 0, // Query Stripe
    revenue_week: 0,
    revenue_month: 0,
    active_users: activeUsers,
    active_customers: profiles?.filter(p => p.role === 'customer').length ?? 0,
    active_therapists: profiles?.filter(p => p.role === 'therapist').length ?? 0,
    active_salongs: profiles?.filter(p => p.role === 'salong').length ?? 0,
    new_signups_24h: newSignups,
    pending_reviews: reviews?.length ?? 0,
    boosts_active: activeBoosts,
  }
}

export async function logAdminAction(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase.from('admin_logs').insert({
    admin_user_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  })
}
