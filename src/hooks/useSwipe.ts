import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const EDGE_SWIPE_USE = 'swipe-use'

export function useSwipe() {
  const { user, refetchProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSwipe = useCallback(
    async (therapistId: string, action: 'like' | 'pass') => {
      if (!user?.id) {
        setError('Not logged in')
        return false
      }
      setError(null)
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const { data, error: fnError } = await supabase.functions.invoke(EDGE_SWIPE_USE, {
          body: { therapist_id: therapistId, action },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (fnError) throw fnError
        if (data?.error) throw new Error(data.error)
        await refetchProfile()
        return true
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Swipe failed'
        setError(msg)
        return false
      } finally {
        setLoading(false)
      }
    },
    [user?.id, refetchProfile]
  )

  return { performSwipe, loading, error }
}
