import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSwipe } from '@/hooks/useSwipe'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { MapButton } from '@/components/MapButton'
import { UnlockModal } from '@/components/UnlockModal'
import { trackSwipe } from '@/lib/analytics'
import { distanceKm } from '@/lib/geo'
import './Swipe.css'

const RADIUS_KM = 5

type Therapist = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  location_city?: string | null
  location_lat?: number | null
  location_lng?: number | null
  share_location?: boolean
}

export default function Swipe() {
  const { profile } = useAuth()
  const { performSwipe, loading, error } = useSwipe()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<'like' | 'pass' | null>(null)
  const [radiusFilter, setRadiusFilter] = useState(true)
  const [unlockTherapist, setUnlockTherapist] = useState<Therapist | null>(null)

  const customerLat = (profile as { location_lat?: number })?.location_lat
  const customerLng = (profile as { location_lng?: number })?.location_lng
  const customerCity = (profile as { location_city?: string })?.location_city

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('therapists')
        .select('id, name, image_url, bio, location_city, location_lat, location_lng, share_location')
        .limit(50)
      if (customerCity) {
        query = query.eq('location_city', customerCity)
      }
      const { data } = await query
      setTherapists((data as Therapist[]) ?? [])
    }
    load()
  }, [customerCity])

  const therapistsInRadius = useMemo(() => {
    if (!radiusFilter || customerLat == null || customerLng == null) return therapists
    return therapists.filter((t) => {
      if (!t.share_location || t.location_lat == null || t.location_lng == null) return true
      return distanceKm(customerLat, customerLng, t.location_lat, t.location_lng) < RADIUS_KM
    })
  }, [therapists, radiusFilter, customerLat, customerLng])

  const currentList = radiusFilter && (customerLat != null && customerLng != null) ? therapistsInRadius : therapists
  const current = currentList[index]
  const canSwipe = (profile?.swipes_remaining ?? 0) > 0 && !loading

  async function handleAction(action: 'like' | 'pass') {
    if (!current || !canSwipe) return
    setFeedback(action)
    trackSwipe(action, current.id)
    const ok = await performSwipe(current.id, action)
    if (ok) {
      setTimeout(() => {
        setFeedback(null)
        setIndex((i) => i + 1)
      }, 400)
    } else {
      setFeedback(null)
    }
  }

  if (currentList.length === 0 && index === 0) {
    return (
      <div className="swipe-page">
        <p className="muted">Loading therapists…</p>
      </div>
    )
  }

  if (index >= currentList.length) {
    return (
      <div className="swipe-page">
        <p>No more therapists right now.</p>
        <Link to="/">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="swipe-page">
      <div className="swipe-header">
        <span>{profile?.swipes_remaining ?? 0} swipes left</span>
        {customerCity && (
          <label className="radius-filter">
            <input
              type="checkbox"
              checked={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.checked)}
            />
            &lt;5km
          </label>
        )}
        {(profile?.swipes_remaining ?? 0) <= 0 && (
          <Link to="/pricing" className="link">Get more</Link>
        )}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className={`card-swipe ${feedback ? `feedback-${feedback}` : ''}`}>
        <OptimizedImage
          src={current?.image_url || null}
          alt={current?.name || 'Therapist'}
          className="card-image"
          lazy={true}
        />
        <div className="card-body">
          <h2>{current?.name ?? 'Therapist'}</h2>
          {current?.location_city && (
            <p className="card-location">📍 {current.location_city}</p>
          )}
          <p>{current?.bio ?? 'No bio'}</p>
          {current?.share_location && current?.location_lat != null && current?.location_lng != null ? (
            <MapButton lat={current.location_lat} lng={current.location_lng} label="Open in Maps" />
          ) : current ? (
            <p className="location-private">Location private</p>
          ) : null}
          {current && (
            <button
              type="button"
              className="btn-unlock-card"
              onClick={() => setUnlockTherapist(current)}
            >
              Unlock profile
            </button>
          )}
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn-pass"
            onClick={() => handleAction('pass')}
            disabled={!canSwipe}
          >
            Pass
          </button>
          <button
            type="button"
            className="btn-like"
            onClick={() => handleAction('like')}
            disabled={!canSwipe}
          >
            Like
          </button>
        </div>
      </div>
      {unlockTherapist && (
        <UnlockModal
          therapist={unlockTherapist}
          onClose={() => setUnlockTherapist(null)}
        />
      )}
    </div>
  )
}
