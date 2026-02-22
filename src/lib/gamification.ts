import { supabase } from './supabase'

export interface StreakData {
  current_streak: number
  last_login: string
  longest_streak: number
}

export interface Badge {
  id: string
  name: string
  description: string
  unlocked_at: string | null
}

export async function getStreak(userId: string): Promise<StreakData> {
  const { data } = await supabase
    .from('profiles')
    .select('streak_data')
    .eq('user_id', userId)
    .single()
  
  return (data?.streak_data as StreakData) || {
    current_streak: 0,
    last_login: new Date().toISOString(),
    longest_streak: 0,
  }
}

export async function updateStreak(userId: string): Promise<number> {
  const streak = await getStreak(userId)
  const now = new Date()
  const lastLogin = new Date(streak.last_login)
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
  
  let newStreak = streak.current_streak
  if (daysSinceLogin === 1) {
    newStreak += 1
  } else if (daysSinceLogin > 1) {
    newStreak = 1 // Reset streak
  }
  
  const updatedStreak: StreakData = {
    current_streak: newStreak,
    last_login: now.toISOString(),
    longest_streak: Math.max(newStreak, streak.longest_streak),
  }
  
  await supabase
    .from('profiles')
    .update({ streak_data: updatedStreak })
    .eq('user_id', userId)

  // Unlock streak badges (1–5 days)
  const streakBadges = [
    { id: 'streak_1', name: '1 day', description: '1 day streak' },
    { id: 'streak_2', name: '2 days', description: '2 day streak' },
    { id: 'streak_3', name: '3 days', description: '3 day streak' },
    { id: 'streak_4', name: '4 days', description: '4 day streak' },
    { id: 'streak_5', name: '5 days', description: '5 day streak' },
  ]
  if (newStreak >= 1 && newStreak <= 5) {
    const badge = streakBadges[newStreak - 1]
    await unlockBadge(userId, badge.id, badge.name, badge.description)
  }
  
  // Grant bonus swipe for daily login
  if (daysSinceLogin >= 1) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('swipes_remaining')
      .eq('user_id', userId)
      .single()
    
    await supabase
      .from('profiles')
      .update({ swipes_remaining: (profile?.swipes_remaining || 0) + 1 })
      .eq('user_id', userId)
  }
  
  return newStreak
}

export async function getBadges(userId: string): Promise<Badge[]> {
  const { data } = await supabase
    .from('profiles')
    .select('badges')
    .eq('user_id', userId)
    .single()
  
  return (data?.badges as Badge[]) || []
}

export async function unlockBadge(userId: string, badgeId: string, badgeName: string, description: string) {
  const badges = await getBadges(userId)
  if (badges.some((b) => b.id === badgeId)) return // Already unlocked
  
  badges.push({
    id: badgeId,
    name: badgeName,
    description,
    unlocked_at: new Date().toISOString(),
  })
  
  await supabase
    .from('profiles')
    .update({ badges })
    .eq('user_id', userId)
}

export async function generateReferralCode(userId: string): Promise<string> {
  const code = `REF${userId.slice(0, 8).toUpperCase()}`
  await supabase
    .from('profiles')
    .update({ referral_code: code })
    .eq('user_id', userId)
  return code
}

export async function applyReferralCode(userId: string, code: string): Promise<boolean> {
  const { data: referrer } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', code.toUpperCase())
    .single()
  
  if (!referrer) return false
  
  // Grant boost to both users
  const expires = new Date()
  expires.setHours(expires.getHours() + 24)
  
  await Promise.all([
    supabase
      .from('profiles')
      .update({ boost_expires: expires.toISOString(), visibility_score: 5 })
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .update({ boost_expires: expires.toISOString(), visibility_score: 5 })
      .eq('user_id', referrer.user_id),
  ])
  
  return true
}
