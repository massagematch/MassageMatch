import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getStreak } from '@/lib/gamification'
import './StreakBadge.css'

export function StreakBadge() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    getStreak(user.id).then((data) => setStreak(data.current_streak))
  }, [user?.id])

  if (!streak) return null

  return (
    <div className="streak-badge" title={`${streak} day login streak`}>
      🔥 {streak}
    </div>
  )
}
