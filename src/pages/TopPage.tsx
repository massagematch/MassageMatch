import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { ROUTES } from '@/constants/routes'
import './TopPage.css'

const CANONICAL_TOP = 'https://massagematchthai.com/top'

type TopCard = {
  id: string
  name: string
  image_url: string | null
  location_city: string | null
}

export default function TopPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<TopCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data } = await supabase.rpc('get_therapists_visible', { p_city: null })
        const rows = (data ?? []) as { id: string; name: string; image_url: string | null; location_city: string | null }[]
        if (!cancelled) {
          setList(rows.filter((t) => t.image_url).slice(0, 10))
        }
      } catch {
        if (!cancelled) setList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleCardClick = () => {
    navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.TOP } })
  }

  return (
    <>
      <Helmet>
        <title>Top Rated Therapists in Thailand | MassageMatch</title>
        <meta
          name="description"
          content="Explore top rated therapist profiles in Thailand. Browse and book your favorite for an outcall to your hotel."
        />
        <link rel="canonical" href={CANONICAL_TOP} />
        <meta property="og:title" content="Top Rated Therapists in Thailand | MassageMatch" />
        <meta property="og:url" content={CANONICAL_TOP} />
      </Helmet>
      <div className="top-page">
      <div className="top-page-inner">
        <h1>Top 10 freelancers</h1>
        <p className="top-page-sub">Register to see who they are and get in touch.</p>
        {loading ? (
          <p className="top-page-loading">Loading…</p>
        ) : list.length === 0 ? (
          <p className="top-page-empty">No profiles right now. Check back later.</p>
        ) : (
          <div className="top-page-grid">
            {list.map((t) => (
              <button
                key={t.id}
                type="button"
                className="top-page-card"
                onClick={handleCardClick}
              >
                <div className="top-page-card-blur">
                  <OptimizedImage
                    src={t.image_url}
                    alt={t.name}
                    className="top-page-card-img"
                    lazy
                  />
                </div>
                <span className="top-page-card-name">{t.name}</span>
                {t.location_city && (
                  <span className="top-page-card-city">{t.location_city}</span>
                )}
              </button>
            ))}
          </div>
        )}
        <Link to={ROUTES.LOGIN} className="top-page-cta">
          Register to see full profiles →
        </Link>
      </div>
    </div>
    </>
  )
}
