import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MapButton } from '@/components/MapButton'
import { OptimizedImage } from '@/components/OptimizedImage'
import { trackUnlockFunnel } from '@/lib/analytics'
import './UnlockedProfiles.css'

const UNLOCK_PRICE_ID = import.meta.env.VITE_STRIPE_UNLOCK_PROFILE ?? ''
const EXTEND_PRICE_THB = 24

type UnlockedRow = {
  id: string
  therapist_id: string | null
  salong_id: string | null
  unlocked_at: string
  expires_at: string | null
  messages_sent: number
  therapist?: {
    id: string
    name: string
    image_url: string | null
    phone: string | null
    whatsapp: string | null
    location_lat: number | null
    location_lng: number | null
  } | null
}

type Tab = 'active' | 'expired' | 'contacted'

export default function UnlockedProfiles() {
  const { user } = useAuth()
  const [rows, setRows] = useState<UnlockedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')
  const [extending, setExtending] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: raw } = await supabase
        .from('unlocked_profiles')
        .select('id,therapist_id,salong_id,unlocked_at,expires_at,messages_sent,therapists(id,name,image_url,phone,whatsapp,location_lat,location_lng)')
        .eq('user_id', user?.id ?? '')
        .order('unlocked_at', { ascending: false })
      const list = (raw ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        therapist_id: r.therapist_id as string | null,
        salong_id: r.salong_id as string | null,
        unlocked_at: r.unlocked_at as string,
        expires_at: r.expires_at as string | null,
        messages_sent: (r.messages_sent as number) ?? 0,
        therapist: (r.therapists as UnlockedRow['therapist']) ?? null,
      }))
      setRows(list)
      setLoading(false)
    }
    if (user?.id) load()
  }, [user?.id])

  const now = new Date()
  const active = rows.filter((r) => r.expires_at && new Date(r.expires_at) > now)
  const expired = rows.filter((r) => !r.expires_at || new Date(r.expires_at) <= now)
  const byContacted = [...rows].sort((a, b) => b.messages_sent - a.messages_sent)
  const list = tab === 'active' ? active : tab === 'expired' ? expired : byContacted

  async function handleExtend(therapistId: string) {
    if (!UNLOCK_PRICE_ID || !user) return
    setExtending(therapistId)
    trackUnlockFunnel('extend_clicked', { therapist_id: therapistId })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: UNLOCK_PRICE_ID,
          plan_type: 'unlock-profile',
          therapist_id: therapistId,
          success_url: `${window.location.origin}/unlocked-profiles?success=1`,
          cancel_url: `${window.location.origin}/unlocked-profiles`,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
      if (fnErr) throw fnErr
      if (data?.url) {
        window.location.assign(data.url)
        return
      }
      if (data?.error) throw new Error(data.error)
    } catch (e) {
      console.error(e)
    } finally {
      setExtending(null)
    }
  }

  if (loading) {
    return (
      <div className="unlocked-page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="unlocked-page">
      <h1>Unlocked profiles</h1>
      {window.location.search.includes('success=1') && (
        <div className="alert success">Unlock successful. You can contact below.</div>
      )}
      <div className="unlocked-tabs">
        <button type="button" className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
          Active ({active.length})
        </button>
        <button type="button" className={tab === 'expired' ? 'active' : ''} onClick={() => setTab('expired')}>
          Expired ({expired.length})
        </button>
        <button type="button" className={tab === 'contacted' ? 'active' : ''} onClick={() => setTab('contacted')}>
          Most contacted
        </button>
      </div>
      {list.length === 0 ? (
        <p className="muted">
          {tab === 'active' && 'No active unlocks. Unlock a profile from Swipe.'}
          {tab === 'expired' && 'No expired unlocks.'}
          {tab === 'contacted' && 'No contacts yet.'}
        </p>
      ) : (
        <div className="unlocked-cards">
          {list.map((r) => {
            const t = r.therapist
            if (!t) return null
            const isActive = r.expires_at && new Date(r.expires_at) > now
            const waNum = t.whatsapp?.replace(/\D/g, '') || t.phone?.replace(/\D/g, '')
            const waUrl = waNum ? `https://wa.me/${waNum}` : null
            const telUrl = t.phone ? `tel:${t.phone}` : null
            return (
              <div key={r.id} className={`unlocked-card ${isActive ? 'active' : 'expired'}`}>
                <OptimizedImage src={t.image_url} alt={t.name} className="unlocked-card-img" lazy />
                <div className="unlocked-card-body">
                  <h3>{t.name}</h3>
                  <div className="unlocked-card-actions">
                    {waUrl && (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-contact wa">
                        WhatsApp
                      </a>
                    )}
                    {telUrl && <a href={telUrl} className="btn-contact call">Call</a>}
                    {t.location_lat != null && t.location_lng != null && (
                      <MapButton lat={t.location_lat} lng={t.location_lng} label="Maps" className="btn-contact" />
                    )}
                  </div>
                  {!isActive && (
                    <button
                      type="button"
                      className="btn-extend"
                      onClick={() => handleExtend(t.id)}
                      disabled={extending === t.id || !UNLOCK_PRICE_ID}
                    >
                      {extending === t.id ? '…' : `Extend access ${EXTEND_PRICE_THB} THB`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="unlocked-back">
        <Link to="/swipe">← Back to Swipe</Link>
      </p>
    </div>
  )
}
