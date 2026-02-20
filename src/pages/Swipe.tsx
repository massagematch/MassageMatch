import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSwipe } from '@/hooks/useSwipe'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { trackSwipe } from '@/lib/analytics'
import './Swipe.css'

type Therapist = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
}

export default function Swipe() {
  const { profile } = useAuth()
  const { performSwipe, loading, error } = useSwipe()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<'like' | 'pass' | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('therapists').select('id, name, image_url, bio').limit(20)
      setTherapists((data as Therapist[]) ?? [])
    }
    load()
  }, [])

  const current = therapists[index]
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

  if (therapists.length === 0 && index === 0) {
    return (
      <div className="swipe-page">
        <p className="muted">Loading therapists…</p>
      </div>
    )
  }

  if (index >= therapists.length) {
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
        {(profile?.swipes_remaining ?? 0) <= 0 && (
          <Link to="/premium" className="link">Get more</Link>
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
          <p>{current?.bio ?? 'No bio'}</p>
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
    </div>
  )
}
