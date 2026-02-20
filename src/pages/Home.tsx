import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { PaywallModal } from '@/components/PaywallModal'
import './Home.css'

type TopTherapist = {
  id: string
  name: string
  image_url: string | null
  location_city: string | null
  verified_photo?: boolean
}

export default function Home() {
  const { profile } = useAuth()
  const [topTherapists, setTopTherapists] = useState<TopTherapist[]>([])
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('therapists')
        .select('id, name, image_url, location_city, verified_photo')
        .not('image_url', 'is', null)
        .limit(6)
      setTopTherapists((data as TopTherapist[]) ?? [])
    }
    load()
  }, [])

  return (
    <div className="home">
      <h1>Welcome to MassageMatch Thailand</h1>
      <p className="muted">
        You have <strong>{profile?.swipes_remaining ?? 0}</strong> free swipes today.
        Premium gives you 12h access + 10 extra swipes.
      </p>

      {topTherapists.length > 0 && (
        <section className="home-top-section">
          <h2 className="home-top-title">Top therapists in Phuket</h2>
          <div className="home-top-grid">
            {topTherapists.map((t) => (
              <button
                key={t.id}
                type="button"
                className="home-top-card"
                onClick={() => setShowPaywall(true)}
              >
                <div className="home-top-card-blur">
                  <OptimizedImage
                    src={t.image_url}
                    alt={t.name}
                    className="home-top-card-img"
                    lazy={true}
                  />
                </div>
                <div className="home-top-card-teaser">
                  <h3 className="home-top-card-name">{t.name}</h3>
                  <p className="home-top-card-meta">
                    {t.verified_photo && <span className="verified">Verified ✓</span>}
                    {t.location_city && <span>{t.location_city}</span>}
                  </p>
                  <p className="home-top-card-available">Available NOW</p>
                </div>
              </button>
            ))}
          </div>
          <p className="home-top-hint">Tap to unlock full profiles</p>
        </section>
      )}

      <nav className="nav-cards">
        <Link to="/swipe" className="card">
          <span className="card-title">Swipe</span>
          <span className="card-desc">Discover therapists</span>
        </Link>
        <Link to="/pricing" className="card accent">
          <span className="card-title">Pricing</span>
          <span className="card-desc">View plans & upgrades</span>
        </Link>
        <Link to="/dashboard" className="card">
          <span className="card-title">Dashboard</span>
          <span className="card-desc">Metrics & settings</span>
        </Link>
      </nav>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} mode="signup" />
    </div>
  )
}
