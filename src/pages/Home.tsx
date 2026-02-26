import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { PaywallModal } from '@/components/PaywallModal'
import './Home.css'

const CANONICAL_HOME = 'https://massagematchthai.com/'

type TopTherapist = {
  id: string
  name: string
  image_url: string | null
  location_city: string | null
  verified_photo?: boolean
}

const CITY_MAP: Record<string, string> = {
  phuket: 'Phuket',
  bangkok: 'Bangkok',
  pattaya: 'Pattaya',
  'chiang-mai': 'Chiang Mai',
}

interface HomeProps {
  city?: string
}

export default function Home({ city: citySlug }: HomeProps = {}) {
  const { profile } = useAuth()
  const [topTherapists, setTopTherapists] = useState<TopTherapist[]>([])
  const [showPaywall, setShowPaywall] = useState(false)
  const cityName = citySlug ? CITY_MAP[citySlug] || citySlug : null

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.rpc('get_therapists_visible', { p_city: cityName })
        const list = (data ?? []) as { id: string; name: string; image_url: string | null; location_city: string | null; verified_photo?: boolean }[]
        setTopTherapists(list.filter((t) => t.image_url).slice(0, 6))
      } catch {
        setTopTherapists([])
      }
    }
    load()
  }, [cityName])

  return (
    <>
      <Helmet>
        <title>MassageMatch Thailand | Freelance Massage in Phuket, Bangkok &amp; Pattaya</title>
        <meta
          name="description"
          content="Find and book freelance massage in Thailand. Browse therapists in Phuket, Bangkok and Pattaya, then book an outcall to your hotel."
        />
        <link rel="canonical" href={CANONICAL_HOME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MassageMatch Thailand" />
        <meta
          property="og:description"
          content="Freelance massage in Phuket, Bangkok & Pattaya. Browse and book outcall to your hotel."
        />
        <meta property="og:url" content={CANONICAL_HOME} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="home">
      <h1>Welcome to MassageMatch Thailand</h1>
      <p className="muted">
        You have <strong>{profile?.swipes_remaining ?? 0}</strong> free swipes today.
        Premium gives you 12h access + 10 extra swipes.
      </p>

      {topTherapists.length > 0 && (
        <section className="home-top-section">
          <h2 className="home-top-title">Top freelancers in {cityName || 'Phuket'}</h2>
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
        <Link to={ROUTES.SWIPE} className="card">
          <span className="card-title">Swipe</span>
          <span className="card-desc">Discover freelancers</span>
        </Link>
        <Link to={ROUTES.PRICING} className="card accent">
          <span className="card-title">Pricing</span>
          <span className="card-desc">View plans & upgrades</span>
        </Link>
        <Link to={ROUTES.DASHBOARD} className="card">
          <span className="card-title">Dashboard</span>
          <span className="card-desc">Metrics & settings</span>
        </Link>
      </nav>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} mode="signup" />
    </div>
    </>
  )
}
