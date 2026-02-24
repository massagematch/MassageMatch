import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin'
import type { Profile } from '@/lib/supabase'
import Home from '@/pages/Home'
import Swipe from '@/pages/Swipe'
import Pricing from '@/pages/Pricing'
import Dashboard from '@/pages/Dashboard'
import { Routes, Route } from 'react-router-dom'
import './AdminImpersonate.css'

export default function AdminImpersonate() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadProfile()
    logAdminAction('impersonate_user', 'profile', userId)
  }, [userId])

  async function loadProfile() {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      setImpersonatedProfile(data as Profile)
    } catch (e) {
      console.error('Failed to load profile', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleExit() {
    await logAdminAction('exit_impersonation', 'profile', userId)
    navigate(ROUTES.ADMIN_USERS)
  }

  if (loading) {
    return <div className="admin-loading">Loading user profile...</div>
  }

  if (!impersonatedProfile) {
    return (
      <div className="admin-error">
        <p>User not found</p>
        <button type="button" onClick={() => navigate(ROUTES.ADMIN_USERS)} className="btn-back">
          Back to Users
        </button>
      </div>
    )
  }

  // Create a custom auth context that returns the impersonated user
  return (
    <div className="admin-impersonate">
      <div className="impersonate-banner">
        <div className="banner-content">
          <span className="banner-icon">👁️</span>
          <span className="banner-text">
            <strong>ADMIN MODE</strong> — Impersonating:{' '}
            {impersonatedProfile.user_id.slice(0, 8)}... ({impersonatedProfile.role})
          </span>
        </div>
        <button type="button" onClick={handleExit} className="btn-exit-impersonate">
          Exit Impersonation
        </button>
      </div>
      <div className="impersonate-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="swipe" element={<Swipe />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  )
}
