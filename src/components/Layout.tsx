import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AccessTimer } from '@/components/AccessTimer'
import { StreakBadge } from '@/components/StreakBadge'
import { useRealtime } from '@/contexts/RealtimeContext'
import { AdminFooterButton } from '@/components/AdminFooterButton'
import { NotificationBell } from '@/components/NotificationBell'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './Layout.css'

export default function Layout() {
  const { user, profile, signOut, error: authError } = useAuth()
  const { connected } = useRealtime()
  usePushSubscription(user?.id)

  return (
    <div className="layout">
      {authError && (
        <div className="layout-auth-error" role="alert">
          {authError}
          <button type="button" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      )}
      {profile && !(profile.plan_expires ? new Date(profile.plan_expires) > new Date() : false) && (
        <Link to="/pricing" className="ad-cta-banner">
          Ingen reklam för 99 THB! →
        </Link>
      )}
      <header className="header">
        <span className="brand">MassageMatch Thailand</span>
        <div className="header-right">
          <NotificationBell />
          <StreakBadge />
          <AccessTimer />
          {connected && <span className="badge live" title="Realtime sync">Live</span>}
          {profile != null && (
            <>
              <span className="role-badge" title={`Role: ${profile.role}`}>
                {profile.role === 'therapist' ? 'therapist/freelance' : profile.role}
              </span>
              <span className="swipes" title="Swipes remaining">
                {profile.swipes_remaining} swipes
              </span>
            </>
          )}
          <span className="email">{user?.email}</span>
          <Link to="/unlocked-profiles" className="btn-outline">Unlocked</Link>
          <Link to="/profile" className="btn-outline">Profile</Link>
          <button type="button" onClick={() => signOut()} className="btn-outline">
            Sign out
          </button>
        </div>
      </header>
      <main className="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <AdminFooterButton />
    </div>
  )
}
