import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { PaywallModal } from '@/components/PaywallModal'
import { getCityData, CITY_SLUGS } from '@/lib/cityConfig'
import './CityPage.css'

type TopTherapist = {
  id: string
  name: string
  image_url: string | null
  location_city: string | null
  verified_photo?: boolean
}

export default function CityPage() {
  const { city: citySlug } = useParams<{ city: string }>()
  const validSlug = citySlug && CITY_SLUGS.includes(citySlug) ? citySlug : ''
  const data = getCityData(validSlug)
  const [topTherapists, setTopTherapists] = useState<TopTherapist[]>([])
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    if (!data) return
    document.title = `${data.title} | MassageMatch Thailand`
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute(
      'content',
      `Bästa ${data.h1}. Freelance terapeuter ${data.locations.join(', ')}. Boka massage nära dig.`
    )
    return () => {
      document.title = 'MassageMatch Thailand'
    }
  }, [data])

  useEffect(() => {
    if (!data?.cityName) return
    const load = async () => {
      const { data: list } = await supabase.rpc('get_therapists_visible', {
        p_city: data.cityName,
      })
      const rows = (list ?? []) as TopTherapist[]
      setTopTherapists(rows.filter((t) => t.image_url).slice(0, 6))
    }
    load()
  }, [data?.cityName])

  if (!data) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="city-page">
      <h1 className="city-page-h1">{data.h1}</h1>
      <p className="city-page-desc">
        Bästa freelance-terapeuter i {data.cityName}. Massage inom området – boka via Swipe.
      </p>

      <section className="city-page-locations">
        <h2 className="city-page-section-title">Områden</h2>
        <div className="city-page-locations-grid">
          {data.locations.map((loc) => (
            <div key={loc} className="city-page-location-card">
              <h3 className="city-page-location-name">{loc}</h3>
              <p className="city-page-location-hint">Massage nära dig – Boka nu</p>
            </div>
          ))}
        </div>
      </section>

      {topTherapists.length > 0 && (
        <section className="city-page-top">
          <h2 className="city-page-section-title">Top freelancers i {data.cityName}</h2>
          <div className="city-page-top-grid">
            {topTherapists.map((t) => (
              <button
                key={t.id}
                type="button"
                className="city-page-card"
                onClick={() => setShowPaywall(true)}
              >
                <OptimizedImage
                  src={t.image_url}
                  alt={t.name}
                  className="city-page-card-img"
                  lazy
                />
                <div className="city-page-card-info">
                  <span className="city-page-card-name">{t.name}</span>
                  {t.verified_photo && <span className="city-page-verified">Verified ✓</span>}
                  {t.location_city && <span className="city-page-card-meta">{t.location_city}</span>}
                </div>
              </button>
            ))}
          </div>
          <p className="city-page-hint">Tryck för att öppna profiler</p>
        </section>
      )}

      <div className="city-page-cta">
        <Link to="/swipe" className="city-page-cta-btn">
          Swipa freelancers i {data.cityName}
        </Link>
      </div>

      <nav className="city-page-nav">
        <Link to="/" className="city-page-nav-link">Hem</Link>
        <Link to="/pricing" className="city-page-nav-link">Priser</Link>
        <Link to="/dashboard" className="city-page-nav-link">Dashboard</Link>
      </nav>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} mode="signup" />
    </div>
  )
}
