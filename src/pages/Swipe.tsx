import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSwipe } from '@/hooks/useSwipe'
import { supabase } from '@/lib/supabase'
import { SwipeCard, type SwipeCardProfile } from '@/components/SwipeCard'
import { UnlockModal } from '@/components/UnlockModal'
import { trackSwipe } from '@/lib/analytics'
import { distanceKm } from '@/lib/geo'
import './Swipe.css'

const RADIUS_KM = 5
const CARD_SWIPE_THRESHOLD = 80

export default function Swipe() {
  const { profile } = useAuth()
  const { performSwipe, loading, error } = useSwipe()
  const [therapists, setTherapists] = useState<SwipeCardProfile[]>([])
  const [index, setIndex] = useState(0)
  const [radiusFilter, setRadiusFilter] = useState(true)
  const [unlockTherapist, setUnlockTherapist] = useState<SwipeCardProfile | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [dragCurrentX, setDragCurrentX] = useState(0)
  const lastSwipeRef = useRef<{ index: number; id: string } | null>(null)

  const customerLat = (profile as { location_lat?: number })?.location_lat
  const customerLng = (profile as { location_lng?: number })?.location_lng
  const customerCity = (profile as { location_city?: string })?.location_city

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('therapists')
        .select('id, name, image_url, images, bio, location_city, location_lat, location_lng, share_location, verified_photo')
        .limit(50)
      if (customerCity) query = query.eq('location_city', customerCity)
      const { data } = await query
      const rows = (data ?? []) as (SwipeCardProfile & { images?: unknown })[]
      const withDistance = rows.map((t) => {
        let distance_km: number | null = null
        if (customerLat != null && customerLng != null && t.location_lat != null && t.location_lng != null) {
          distance_km = distanceKm(customerLat, customerLng, t.location_lat, t.location_lng)
        }
        return { ...t, images: Array.isArray(t.images) ? t.images : null, distance_km } as SwipeCardProfile
      })
      setTherapists(withDistance)
    }
    load()
  }, [customerCity])

  const therapistsInRadius = useMemo(() => {
    if (!radiusFilter || customerLat == null || customerLng == null) return therapists
    return therapists.filter((t) => {
      if (!t.share_location || t.location_lat == null || t.location_lng == null) return true
      return (t.distance_km ?? 0) < RADIUS_KM
    })
  }, [therapists, radiusFilter, customerLat, customerLng])

  const currentList = radiusFilter && customerLat != null && customerLng != null ? therapistsInRadius : therapists
  const current = currentList[index]
  const canSwipe = (profile?.swipes_remaining ?? 0) > 0 && !loading

  const dragX = dragStartX != null ? dragCurrentX - dragStartX : 0

  const handleDragStart = useCallback((clientX: number) => {
    setDragStartX(clientX)
    setDragCurrentX(clientX)
  }, [])

  const handleDragMove = useCallback((clientX: number) => {
    setDragCurrentX(clientX)
  }, [])

  const handleAction = useCallback(
    async (action: 'like' | 'pass') => {
      if (!current || !canSwipe) return
      lastSwipeRef.current = { index, id: current.id }
      trackSwipe(action, current.id)
      const ok = await performSwipe(current.id, action)
      if (ok) setIndex((i) => i + 1)
    },
    [current, canSwipe, index, performSwipe]
  )

  const handleDragEnd = useCallback(() => {
    if (dragStartX == null || !current || !canSwipe) {
      setDragStartX(null)
      return
    }
    const dx = dragCurrentX - dragStartX
    setDragStartX(null)
    if (dx > CARD_SWIPE_THRESHOLD) {
      handleAction('like')
    } else if (dx < -CARD_SWIPE_THRESHOLD) {
      handleAction('pass')
    }
  }, [dragStartX, dragCurrentX, current, canSwipe, handleAction])

  function handleUndo() {
    if (lastSwipeRef.current && lastSwipeRef.current.index === index - 1) {
      setIndex(lastSwipeRef.current.index)
      lastSwipeRef.current = null
    }
  }

  const locationLabel = customerCity || 'Phuket'
  const distanceLabel = current?.distance_km != null ? `${current.distance_km.toFixed(0)}km` : ''

  if (currentList.length === 0 && index === 0) {
    return (
      <div className="swipe-page swipe-page-full">
        <p className="muted">Loading therapists…</p>
      </div>
    )
  }

  if (index >= currentList.length) {
    return (
      <div className="swipe-page swipe-page-full">
        <p>No more therapists right now.</p>
        <Link to="/">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="swipe-page swipe-page-full">
      <header className="swipe-header-bar">
        <button type="button" className="swipe-header-btn" onClick={handleUndo} aria-label="Undo">
          ↶ Undo
        </button>
        <span className="swipe-header-title">
          {locationLabel} {distanceLabel && `(${distanceLabel})`}
        </span>
        <button
          type="button"
          className="swipe-header-btn"
          onClick={() => setFilterOpen(!filterOpen)}
          aria-label="Filter"
        >
          Filter
        </button>
      </header>

      {filterOpen && (
        <div className="swipe-filter-panel">
          <label className="radius-filter">
            <input type="checkbox" checked={radiusFilter} onChange={(e) => setRadiusFilter(e.target.checked)} />
            &lt;5km only
          </label>
        </div>
      )}

      <div className="swipe-stack">
        {currentList.slice(index, index + 3).map((p, i) => (
          <div key={p.id} className={`swipe-stack-card stack-${i}`}>
            <SwipeCard
              profile={p}
              isTop={i === 0}
              dragX={i === 0 ? dragX : 0}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onSwipeLeft={() => handleAction('pass')}
              onSwipeRight={() => handleAction('like')}
              onUnlock={() => setUnlockTherapist(p)}
            />
          </div>
        ))}
      </div>

      <div className="swipe-footer-meta">
        <span>{profile?.swipes_remaining ?? 0} swipes left</span>
        {(profile?.swipes_remaining ?? 0) <= 0 && (
          <Link to="/pricing" className="link">Get more</Link>
        )}
      </div>

      {error && <div className="alert error swipe-alert">{error}</div>}
      {unlockTherapist && (
        <UnlockModal therapist={unlockTherapist} onClose={() => setUnlockTherapist(null)} />
      )}
    </div>
  )
}
