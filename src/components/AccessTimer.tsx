import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import './AccessTimer.css'

function formatLeft(ms: number): string {
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m left`
  if (m > 0) return `${m}m left`
  return '< 1m left'
}

export function AccessTimer() {
  const { profile } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const accessExpires = profile?.access_expires ? new Date(profile.access_expires).getTime() : null
  const hasAccess = accessExpires != null && now < accessExpires

  useEffect(() => {
    if (accessExpires == null || accessExpires <= now) return
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [accessExpires, now])

  if (!profile || accessExpires == null) return null
  const left = hasAccess ? accessExpires - now : 0

  return (
    <span className={`access-timer ${hasAccess ? 'active' : 'expired'}`} title="Premium access">
      {hasAccess ? formatLeft(left) : 'Premium expired'}
    </span>
  )
}
