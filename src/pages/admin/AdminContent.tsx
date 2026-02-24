import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin'
import './AdminContent.css'

type Therapist = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  created_at: string
}

type Salong = {
  id: string
  user_id: string
  name: string
  image_url: string | null
  bio: string | null
  location: string | null
  plan_type: string | null
  plan_expires: string | null
  boost_expires: string | null
}

type DiscountCode = {
  id: string
  code: string
  discount_type: string
  discount_value: number
  plan_type: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  active: boolean
}

export default function AdminContent() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [salongs, setSalongs] = useState<Salong[]>([])
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [activeTab, setActiveTab] = useState<'therapists' | 'salongs' | 'discounts'>('therapists')
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discount_type: 'percentage' as const,
    discount_value: 10,
    plan_type: 'premium',
    max_uses: null as number | null,
    expires_at: '',
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    if (activeTab === 'therapists') {
      const { data } = await supabase.from('therapists').select('*').order('created_at', { ascending: false })
      setTherapists(data || [])
    } else if (activeTab === 'salongs') {
      const { data } = await supabase.from('salongs').select('*').order('created_at', { ascending: false })
      setSalongs(data || [])
    } else {
      const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })
      setDiscounts(data || [])
    }
  }

  async function handleBanTherapist(id: string) {
    if (!confirm('Ban this therapist listing?')) return
    try {
      await supabase.from('therapists').delete().eq('id', id)
      await logAdminAction('ban_therapist', 'therapist', id)
      loadData()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleBanSalong(id: string) {
    if (!confirm('Ban this salong listing?')) return
    try {
      await supabase.from('salongs').delete().eq('id', id)
      await logAdminAction('ban_salong', 'salong', id)
      loadData()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleCreateDiscount() {
    if (!newDiscount.code.trim()) return
    try {
      await supabase.from('discount_codes').insert({
        code: newDiscount.code.toUpperCase(),
        discount_type: newDiscount.discount_type,
        discount_value: newDiscount.discount_value,
        plan_type: newDiscount.plan_type,
        max_uses: newDiscount.max_uses,
        expires_at: newDiscount.expires_at || null,
        active: true,
      })
      await logAdminAction('create_discount', 'discount_code', undefined, newDiscount)
      setNewDiscount({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        plan_type: 'premium',
        max_uses: null,
        expires_at: '',
      })
      loadData()
      alert('Discount code created!')
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleToggleDiscount(id: string, active: boolean) {
    try {
      await supabase.from('discount_codes').update({ active }).eq('id', id)
      await logAdminAction('toggle_discount', 'discount_code', id, { active })
      loadData()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Content Management</h1>
        <Link to={ROUTES.ADMIN} className="btn-back">
          ← Dashboard
        </Link>
      </div>

      <div className="content-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('therapists')}
          className={`tab-btn ${activeTab === 'therapists' ? 'active' : ''}`}
        >
          Therapists ({therapists.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('salongs')}
          className={`tab-btn ${activeTab === 'salongs' ? 'active' : ''}`}
        >
          Salongs ({salongs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discounts')}
          className={`tab-btn ${activeTab === 'discounts' ? 'active' : ''}`}
        >
          Discount Codes ({discounts.length})
        </button>
      </div>

      {activeTab === 'therapists' && (
        <div className="content-list">
          {therapists.map((t) => (
            <div key={t.id} className="content-card">
              <div className="content-card-image">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} />
                ) : (
                  <div className="no-image">No image</div>
                )}
              </div>
              <div className="content-card-info">
                <h3>{t.name}</h3>
                <p>{t.bio || '(No bio)'}</p>
                <div className="content-card-meta">
                  Created: {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="content-card-actions">
                <button
                  type="button"
                  onClick={() => handleBanTherapist(t.id)}
                  className="btn-ban"
                >
                  🚫 Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'salongs' && (
        <div className="content-list">
          {salongs.map((s) => (
            <div key={s.id} className="content-card">
              <div className="content-card-image">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} />
                ) : (
                  <div className="no-image">No image</div>
                )}
              </div>
              <div className="content-card-info">
                <h3>{s.name}</h3>
                <p>{s.bio || '(No bio)'}</p>
                <div className="content-card-meta">
                  Location: {s.location || '—'}
                  {s.plan_expires && (
                    <span className="plan-badge">
                      Plan expires: {new Date(s.plan_expires).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="content-card-actions">
                <button
                  type="button"
                  onClick={() => handleBanSalong(s.id)}
                  className="btn-ban"
                >
                  🚫 Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'discounts' && (
        <div className="discounts-section">
          <div className="new-discount-form">
            <h3>Create New Discount Code</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Code (e.g., NEWTHERAPIST90)"
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                className="form-input"
              />
              <select
                value={newDiscount.discount_type}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, discount_type: e.target.value as any })
                }
                className="form-select"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_months">Free Months</option>
              </select>
              <input
                type="number"
                placeholder="Value"
                value={newDiscount.discount_value}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, discount_value: Number(e.target.value) })
                }
                className="form-input-small"
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Plan type (optional)"
                value={newDiscount.plan_type || ''}
                onChange={(e) => setNewDiscount({ ...newDiscount, plan_type: e.target.value })}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Max uses (optional)"
                value={newDiscount.max_uses || ''}
                onChange={(e) =>
                  setNewDiscount({
                    ...newDiscount,
                    max_uses: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="form-input-small"
              />
              <input
                type="date"
                value={newDiscount.expires_at}
                onChange={(e) => setNewDiscount({ ...newDiscount, expires_at: e.target.value })}
                className="form-input"
              />
            </div>
            <button type="button" onClick={handleCreateDiscount} className="btn-create">
              Create Discount Code
            </button>
          </div>

          <div className="discounts-list">
            {discounts.map((d) => (
              <div key={d.id} className={`discount-card ${!d.active ? 'inactive' : ''}`}>
                <div className="discount-code">{d.code}</div>
                <div className="discount-details">
                  {d.discount_type === 'percentage' && `${d.discount_value}% off`}
                  {d.discount_type === 'fixed' && `${d.discount_value} THB off`}
                  {d.discount_type === 'free_months' && `${d.discount_value} months free`}
                  {d.plan_type && ` • ${d.plan_type}`}
                </div>
                <div className="discount-meta">
                  Uses: {d.uses_count} / {d.max_uses || '∞'}
                  {d.expires_at && ` • Expires: ${new Date(d.expires_at).toLocaleDateString()}`}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDiscount(d.id, !d.active)}
                  className={d.active ? 'btn-deactivate' : 'btn-activate'}
                >
                  {d.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
