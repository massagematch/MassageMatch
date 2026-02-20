import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import './Home.css'

export default function Home() {
  const { profile } = useAuth()

  return (
    <div className="home">
      <h1>Welcome to MassageMatch Thailand</h1>
      <p className="muted">
        You have <strong>{profile?.swipes_remaining ?? 0}</strong> free swipes today.
        Premium gives you 12h access + 10 extra swipes.
      </p>
      <nav className="nav-cards">
        <Link to="/swipe" className="card">
          <span className="card-title">Swipe</span>
          <span className="card-desc">Discover therapists</span>
        </Link>
        <Link to="/pricing" className="card accent">
          <span className="card-title">Pricing</span>
          <span className="card-desc">View plans & upgrades</span>
        </Link>
        <Link to="/dashboard" className="card">
          <span className="card-title">Dashboard</span>
          <span className="card-desc">Metrics & settings</span>
        </Link>
      </nav>
    </div>
  )
}
