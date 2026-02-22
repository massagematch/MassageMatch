/**
 * Subscribe to Web Push and save subscription to Supabase for "Ny like!" etc.
 * Requires: VITE_VAPID_PUBLIC_KEY in env; notify-push Edge Function + VAPID keys in Supabase.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function usePushSubscription(userId: string | undefined) {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'unsupported' | 'denied' | 'error'>('idle')

  useEffect(() => {
    if (!userId || !VAPID_PUBLIC || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (!VAPID_PUBLIC && userId) setStatus('unsupported')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          await supabase.from('push_subscriptions').upsert(
            { user_id: userId, subscription: existing.toJSON(), updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
          if (!cancelled) setStatus('subscribed')
          return
        }
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          if (!cancelled) setStatus('denied')
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC,
        })
        await supabase.from('push_subscriptions').upsert(
          { user_id: userId, subscription: sub.toJSON(), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        if (!cancelled) setStatus('subscribed')
      } catch (e) {
        console.warn('Push subscription failed', e)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  return { status, supported: !!VAPID_PUBLIC && 'PushManager' in window }
}
