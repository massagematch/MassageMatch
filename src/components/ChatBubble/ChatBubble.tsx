import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { OptimizedImage } from '@/components/OptimizedImage'
import { UnlockModal } from '@/components/UnlockModal'
import './ChatBubble.css'

type ChatMatch = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  location_city: string | null
  verified_photo: boolean
  rating_avg: number
  prices: Record<string, number>
}

export function ChatBubble() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [matches, setMatches] = useState<ChatMatch[]>([])
  const [unlockProfile, setUnlockProfile] = useState<ChatMatch | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [message, matches])

  async function handleSend() {
    const q = input.trim()
    if (!q || !user) return
    setError(null)
    setMessage(null)
    setMatches([])
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('chat-query', {
        body: { query: q },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
      if (fnErr) throw fnErr
      if (data?.error) throw new Error(data.error)
      setMessage(data?.message ?? '')
      setMatches((data?.matches ?? []) as ChatMatch[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="chat-bubble"
        onClick={() => setOpen(!open)}
        aria-label="Open chat"
      >
        💬
      </button>

      {open && (
        <div className="chat-modal-overlay" onClick={() => setOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>Phuket 5★ massage?</h3>
              <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="chat-modal-body">
              <p className="chat-hint">Skriv t.ex. &quot;Phuket 5★ under 500 THB&quot;</p>
              <div className="chat-input-row">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Phuket massage 5★ under 500 THB"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button type="button" className="chat-send" onClick={handleSend} disabled={loading}>
                  {loading ? '…' : 'Sök'}
                </button>
              </div>
              {error && <div className="chat-error">{error}</div>}
              {message && <p className="chat-response">{message}</p>}
              {matches.length > 0 && (
                <div className="chat-cards">
                  {matches.map((m) => (
                    <div key={m.id} className="chat-card">
                      <OptimizedImage src={m.image_url} alt={m.name} className="chat-card-img" lazy />
                      <div className="chat-card-info">
                        <strong>{m.name}</strong>
                        <span>{m.rating_avg.toFixed(1)}⭐</span>
                        {m.location_city && <span>{m.location_city}</span>}
                        {m.prices?.thb60min != null && <span>{m.prices.thb60min} THB</span>}
                        <button type="button" className="chat-card-unlock" onClick={() => setUnlockProfile(m)}>
                          Unlock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {unlockProfile && (
        <UnlockModal
          therapist={{ id: unlockProfile.id, name: unlockProfile.name, location_city: unlockProfile.location_city }}
          onClose={() => setUnlockProfile(null)}
        />
      )}
    </>
  )
}
