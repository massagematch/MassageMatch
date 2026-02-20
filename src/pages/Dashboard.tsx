import { useAuth } from '@/contexts/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="metrics">
        <div className="metric">
          <span className="metric-value">{profile?.swipes_remaining ?? 0}</span>
          <span className="metric-label">Swipes remaining</span>
        </div>
        <div className="metric">
          <span className="metric-value">{profile?.swipes_used ?? 0}</span>
          <span className="metric-label">Swipes used</span>
        </div>
        <div className="metric">
          <span className="metric-value">
            {profile?.access_expires
              ? new Date(profile.access_expires) > new Date()
                ? 'Active'
                : 'Expired'
              : '—'}
          </span>
          <span className="metric-label">Premium</span>
        </div>
      </div>
      <p className="muted">
        Admin metrics (total users, swipes, revenue) are available in Supabase dashboard and logs table.
      </p>
    </div>
  )
}
