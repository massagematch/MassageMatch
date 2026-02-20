import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import './PlanTimer.css'

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Expired'
  const d = Math.floor(ms / (24 * 3600000))
  const h = Math.floor((ms % (24 * 3600000)) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  if (m > 0) return `${m}m left`
  return '< 1m left'
}

export function PlanTimer({ type }: { type: 'plan' | 'boost' }) {
  const { profile } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const expires = type === 'plan' ? profile?.plan_expires : profile?.boost_expires
  const expiresTime = expires ? new Date(expires).getTime() : null
  const hasActive = expiresTime != null && now < expiresTime

  useEffect(() => {
    if (!expiresTime || expiresTime <= now) return
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [expiresTime, now])

  if (!expires || !hasActive) return null
  const left = expiresTime - now

  return (
    <div className={`plan-timer ${type}`}>
      <span className="timer-label">{type === 'plan' ? 'Premium' : 'Boost'} active:</span>
      <span className="timer-value">{formatTimeLeft(left)}</span>
    </div>
  )
}
