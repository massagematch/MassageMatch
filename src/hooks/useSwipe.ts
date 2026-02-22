import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const EDGE_SWIPE_USE = 'swipe-use'

export type SwipeLikeMeta = { name?: string; distance_km?: number; city?: string }

export function useSwipe() {
  const { user, profile, refetchProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSwipe = useCallback(
    async (therapistId: string, action: 'like' | 'pass', likeMeta?: SwipeLikeMeta) => {
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
        if (action === 'like' && likeMeta && token) {
          const name = likeMeta.name || (profile as { display_name?: string })?.display_name || 'Någon'
          const dist = likeMeta.distance_km != null ? `${likeMeta.distance_km.toFixed(1)}km ` : ''
          const city = likeMeta.city || 'Phuket'
          supabase.functions.invoke('notify-push', {
            body: {
              target_user_id: therapistId,
              title: 'Ny like!',
              body: `${name} ${dist}${city}`.trim(),
            },
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        }
        return true
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Swipe failed'
        setError(msg)
        return false
      } finally {
        setLoading(false)
      }
    },
    [user?.id, profile, refetchProfile]
  )

  return { performSwipe, loading, error }
}
