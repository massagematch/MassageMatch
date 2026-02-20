import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import './PromoCodeInput.css'

export function PromoCodeInput({ onSuccess }: { onSuccess?: () => void }) {
  const { user, profile } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (profile?.role !== 'therapist' || profile?.promo_used) {
    return null
  }

  async function handleApply() {
    if (!code.trim() || !user) return
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('apply-promo', {
        body: { code: code.trim().toUpperCase() },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })
      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)
      setSuccess(true)
      onSuccess?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to apply promo code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="promo-section">
      <div className="promo-banner">
        <strong>FREE 3-MONTH PROMO:</strong> Enter code <code>NEWTHERAPIST90</code>
      </div>
      <div className="promo-input-group">
        <input
          type="text"
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className="promo-input"
        />
        <button type="button" onClick={handleApply} disabled={loading || !code.trim()} className="btn-promo">
          {loading ? '…' : 'Apply'}
        </button>
      </div>
      {error && <div className="promo-error">{error}</div>}
      {success && <div className="promo-success">Promo code applied! Your FREE 3-month Premium is active.</div>}
    </div>
  )
}
