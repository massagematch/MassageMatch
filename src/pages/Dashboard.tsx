import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import './Dashboard.css'

const CANONICAL_DASHBOARD = 'https://massagematchthai.com/dashboard'

type AITherapist = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  location_city: string | null
  verified_photo?: boolean
  ai_match_percent?: number
}

type NearbyTherapist = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  location_city: string | null
  distance_km: number
  rating_avg: number
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [aiList, setAiList] = useState<AITherapist[]>([])
  const [aiMessage, setAiMessage] = useState<string>('')
  const [nearbyList, setNearbyList] = useState<NearbyTherapist[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ rank: number; display_name: string; referrals_count: number }[]>([])

  const userLat = (profile as { location_lat?: number })?.location_lat
  const userLng = (profile as { location_lng?: number })?.location_lng

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const { data } = await supabase.functions.invoke('ai-recommendations', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        })
        if (cancelled) return
        if (data?.recommendations) {
          setAiList(data.recommendations)
          setAiMessage(data.message || '')
        }
      } catch {
        if (!cancelled) setAiMessage('')
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    if (userLat == null || userLng == null) return
    setNearbyLoading(true)
    void Promise.resolve(
      supabase.rpc('nearby_therapists', { user_lat: userLat, user_lng: userLng, max_distance_km: 5, lim: 10 })
    )
      .then(({ data }) => {
        setNearbyList((data as NearbyTherapist[]) ?? [])
      })
      .finally(() => setNearbyLoading(false))
  }, [userLat, userLng])

  useEffect(() => {
    supabase.rpc('get_referral_leaderboard', { lim: 10 }).then(({ data }) => {
      setLeaderboard((data as { rank: number; display_name: string; referrals_count: number }[]) ?? [])
    })
  }, [])

  return (
    <>
      <Helmet>
        <title>Dashboard | MassageMatch Thailand</title>
        <meta
          name="description"
          content="Your MassageMatch dashboard: swipes, premium status, AI recommendations and nearby therapists."
        />
        <link rel="canonical" href={CANONICAL_DASHBOARD} />
        <meta property="og:title" content="Dashboard | MassageMatch Thailand" />
        <meta property="og:url" content={CANONICAL_DASHBOARD} />
      </Helmet>
      <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="metrics">
        <div className="metric">
          <span className="metric-value">{profile?.swipes_remaining ?? 0}</span>
          <span className="metric-label">Swipes remaining</span>
        </div>
        <div className="metric">
          <span className="metric-value">{profile?.swipes_used ?? 0}</span>
          <span className="metric-label">Swipes used</span>
        </div>
        <div className="metric">
          <span className="metric-value">
            {profile?.access_expires
              ? new Date(profile.access_expires) > new Date()
                ? 'Active'
                : 'Expired'
              : '—'}
          </span>
          <span className="metric-label">Premium</span>
        </div>
      </div>

      <section className="dashboard-section referral-section">
        <h2>📱 Dela → 7d Gratis Premium!</h2>
        <p className="section-desc">Bjud in vänner: när de registrerar och betalar får du 7 dagar gratis Premium.</p>
        <div className="referral-actions">
          <input
            type="text"
            readOnly
            className="referral-input"
            value={user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${user.id}` : ''}
            aria-label="Referral link"
          />
          <button
            type="button"
            className="btn-referral-copy"
            onClick={() => {
              const url = user ? `${window.location.origin}/login?ref=${user.id}` : ''
              if (url && navigator.clipboard) {
                navigator.clipboard.writeText(url)
                // Could add toast "Copied!"
              }
            }}
          >
            Kopiera länk
          </button>
        </div>
      </section>

      {aiList.length > 0 && (
        <section className="dashboard-section ai-section">
          <h2>AI för dig</h2>
          <p className="section-desc">{aiMessage}</p>
          <div className="therapist-cards">
            {aiList.slice(0, 5).map((t) => (
              <Link key={t.id} to={ROUTES.SWIPE} className="therapist-card">
                <OptimizedImage src={t.image_url} alt={t.name} className="card-img" lazy />
                <div className="card-info">
                  <span className="card-name">{t.name}</span>
                  {(t as AITherapist).verified_photo && <span className="verified-badge">Verified ✓</span>}
                  {(t as AITherapist).ai_match_percent != null && (
                    <span className="ai-match-badge">AI Match {(t as AITherapist).ai_match_percent}%</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(userLat != null && userLng != null) && (
        <section className="dashboard-section nearby-section">
          <h2>Freelancers inom 5km</h2>
          {nearbyLoading ? (
            <p className="muted">Loading…</p>
          ) : nearbyList.length === 0 ? (
            <p className="muted">No freelancers within 5km. Update your location in Profile.</p>
          ) : (
            <div className="therapist-cards">
              {nearbyList.map((t) => (
                <Link key={t.id} to={ROUTES.SWIPE} className="therapist-card">
                  <OptimizedImage src={t.image_url} alt={t.name} className="card-img" lazy />
                  <div className="card-info">
                    <span className="card-name">{t.name}</span>
                    <span className="card-distance">{t.distance_km.toFixed(1)} km</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {leaderboard.length > 0 && (
        <section className="dashboard-section leaderboard-section">
          <h2>🏆 Referral leaderboard (top 10)</h2>
          <ul className="leaderboard-list">
            {leaderboard.map((row) => (
              <li key={row.rank} className="leaderboard-row">
                <span className="leaderboard-rank">#{row.rank}</span>
                <span className="leaderboard-name">{row.display_name}</span>
                <span className="leaderboard-count">{row.referrals_count} referrals</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="muted">
        Admin metrics (total users, swipes, revenue) are available in Supabase dashboard and logs table.
      </p>
    </div>
    </>
  )
}
