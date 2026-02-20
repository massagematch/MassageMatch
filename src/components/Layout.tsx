import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AccessTimer } from '@/components/AccessTimer'
import { StreakBadge } from '@/components/StreakBadge'
import { useRealtime } from '@/contexts/RealtimeContext'
import './Layout.css'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const { connected } = useRealtime()

  return (
    <div className="layout">
      <header className="header">
        <span className="brand">MassageMatch Thailand</span>
        <div className="header-right">
          <StreakBadge />
          <AccessTimer />
          {connected && <span className="badge live" title="Realtime sync">Live</span>}
          {profile != null && (
            <>
              <span className="role-badge" title={`Role: ${profile.role}`}>
                {profile.role}
              </span>
              <span className="swipes" title="Swipes remaining">
                {profile.swipes_remaining} swipes
              </span>
            </>
          )}
          <span className="email">{user?.email}</span>
          <Link to="/profile" className="btn-outline">Profile</Link>
          <button type="button" onClick={() => signOut()} className="btn-outline">
            Sign out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
