import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LocationSelector, type LocationValue } from '@/components/LocationSelector'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'therapist' | 'salong'>('customer')
  const [location, setLocation] = useState<LocationValue>({ region: '', city: '', area: '' })
  const [showSignUp, setShowSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [age, setAge] = useState<number>(18)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const referrerId = searchParams.get('ref')?.trim() || null

  const currentYear = new Date().getFullYear()
  const ageOptions = Array.from({ length: 83 }, (_, i) => 18 + i)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (showSignUp && !agreedToRules) {
      setError('Please agree to the rules and FAQ to create an account.')
      return
    }
    if (showSignUp && (age < 18 || age > 100)) {
      setError('You must be 18 or older to register.')
      return
    }
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) throw err
      if (data.user) {
        const birthYear = currentYear - age
        await supabase.from('profiles').upsert(
          {
            user_id: data.user.id,
            role,
            birth_year: birthYear,
            referrer_id: referrerId || null,
            location_region: location.region || null,
            location_city: location.city || null,
            location_area: location.area || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        
        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome', {
            body: { user_id: data.user.id, trigger: 'signup' },
          })
        } catch (e) {
          console.error('Welcome email failed:', e)
        }
      }
      setMessage('Check your email to confirm sign up.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>MassageMatch Thailand</h1>
        <p className="subtitle">Connect with trusted therapists/freelancers</p>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        {showSignUp && (
          <>
            <div className="role-selector">
              <label>I am a:</label>
              <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="role-select">
                <option value="customer">Customer</option>
                <option value="therapist">Therapist/Freelance</option>
                <option value="salong">Salong</option>
              </select>
            </div>
            <div className="age-selector">
              <label htmlFor="signup-age">I am (18+):</label>
              <select id="signup-age" value={age} onChange={(e) => setAge(Number(e.target.value))} className="age-select" required aria-required="true">
                {ageOptions.map((y) => (
                  <option key={y} value={y}>{y} years old</option>
                ))}
              </select>
            </div>
            <div className="location-signup">
              <label>Location (optional):</label>
              <LocationSelector value={location} onChange={setLocation} />
            </div>
          </>
        )}
        <form onSubmit={showSignUp ? handleSignUp : handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={showSignUp ? 'new-password' : 'current-password'}
          />
          {showSignUp && (
          <label className="login-rules-check">
            <input type="checkbox" checked={agreedToRules} onChange={(e) => setAgreedToRules(e.target.checked)} />
            <span>I agree to the rules &amp; FAQ. <a href="/faq#legal" target="_blank" rel="noopener noreferrer" className="link-rules">[Läs regler]</a></span>
          </label>
        )}
        <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (showSignUp ? 'Creating account…' : 'Signing in…') : showSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowSignUp(!showSignUp)
            setError(null)
            setMessage(null)
          }}
          disabled={loading}
        >
          {showSignUp ? 'Already have an account? Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  )
}
