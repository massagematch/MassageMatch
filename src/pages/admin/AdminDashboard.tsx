import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminStats, logAdminAction, type AdminStats } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [freeUserEmail, setFreeUserEmail] = useState('')
  const [freeMonths, setFreeMonths] = useState(1)
  const [discountCode, setDiscountCode] = useState('')
  const [discountValue, setDiscountValue] = useState(10)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (e) {
      console.error('Failed to load stats', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddFreeMembership() {
    if (!freeUserEmail.trim()) return
    try {
      const { data: userData } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', freeUserEmail.trim())
        .single()
      
      if (!userData) {
        alert('User not found')
        return
      }

      const expires = new Date()
      expires.setMonth(expires.getMonth() + freeMonths)

      await supabase
        .from('profiles')
        .update({
          plan_type: 'premium',
          plan_expires: expires.toISOString(),
          visibility_score: 3,
        })
        .eq('user_id', userData.id)

      await logAdminAction('add_free_membership', 'profile', userData.id, {
        months: freeMonths,
        email: freeUserEmail,
      })

      alert('Free membership added!')
      setFreeUserEmail('')
      loadStats()
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  async function handleCreateDiscount() {
    if (!discountCode.trim()) return
    try {
      await supabase.from('discount_codes').insert({
        code: discountCode.toUpperCase(),
        discount_type: 'percentage',
        discount_value: discountValue,
        plan_type: 'premium',
        active: true,
      })

      await logAdminAction('create_discount', 'discount_code', undefined, {
        code: discountCode,
        value: discountValue,
      })

      alert('Discount code created!')
      setDiscountCode('')
      setDiscountValue(10)
    } catch (e) {
      alert('Failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  if (loading) return <div className="admin-loading">Loading dashboard...</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Super Admin Dashboard</h1>
        <div className="admin-user">
          <span>{user?.email}</span>
          <Link to={ROUTES.HOME} className="btn-exit">Exit Admin</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue (Today)</div>
          <div className="stat-value">{stats?.revenue_today.toLocaleString() ?? '0'} THB</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{stats?.active_users ?? 0}</div>
          <div className="stat-sublabel">
            {stats?.active_customers ?? 0} customers, {stats?.active_therapists ?? 0} therapists/freelancers,{' '}
            {stats?.active_salongs ?? 0} salongs
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New Signups (24h)</div>
          <div className="stat-value">{stats?.new_signups_24h ?? 0}</div>
        </div>
        <div className="stat-card alert">
          <div className="stat-label">Pending Reviews</div>
          <div className="stat-value">{stats?.pending_reviews ?? 0}</div>
          {stats && stats.pending_reviews > 0 && (
            <Link to={ROUTES.ADMIN_REVIEWS} className="stat-link">Review now →</Link>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Boosts</div>
          <div className="stat-value">{stats?.boosts_active ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue (Month)</div>
          <div className="stat-value">{stats?.revenue_month.toLocaleString() ?? '0'} THB</div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card">
            <h3>Add Free Membership</h3>
            <input
              type="email"
              placeholder="User email"
              value={freeUserEmail}
              onChange={(e) => setFreeUserEmail(e.target.value)}
              className="action-input"
            />
            <select
              value={freeMonths}
              onChange={(e) => setFreeMonths(Number(e.target.value))}
              className="action-select"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
            <button type="button" onClick={handleAddFreeMembership} className="btn-action">
              Add Free Membership
            </button>
          </div>

          <div className="action-card">
            <h3>Create Discount Code</h3>
            <input
              type="text"
              placeholder="Code (e.g., SILVER10)"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="action-input"
            />
            <div className="discount-row">
              <input
                type="number"
                placeholder="%"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="action-input-small"
                min="1"
                max="100"
              />
              <span>% off</span>
            </div>
            <button type="button" onClick={handleCreateDiscount} className="btn-action">
              Create Code
            </button>
          </div>
        </div>
      </div>

      <div className="admin-nav">
        <Link to={ROUTES.ADMIN_USERS} className="nav-card">
          <span className="nav-icon">👥</span>
          <span className="nav-title">Users</span>
          <span className="nav-desc">Manage all users</span>
        </Link>
        <Link to={ROUTES.ADMIN_REVIEWS} className="nav-card">
          <span className="nav-icon">⭐</span>
          <span className="nav-title">Reviews</span>
          <span className="nav-desc">Moderate reviews</span>
        </Link>
        <Link to={ROUTES.ADMIN_CONTENT} className="nav-card">
          <span className="nav-icon">📝</span>
          <span className="nav-title">Content</span>
          <span className="nav-desc">Therapists/freelancers & discounts</span>
        </Link>
        <Link to={ROUTES.ADMIN_STRIPE} className="nav-card">
          <span className="nav-icon">💰</span>
          <span className="nav-title">Stripe</span>
          <span className="nav-desc">Payments & revenue</span>
        </Link>
      </div>
    </div>
  )
}
