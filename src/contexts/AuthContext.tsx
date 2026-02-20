import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { updateStreak } from '@/lib/gamification'
import { identifyUser } from '@/lib/analytics'

type AuthState = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  refetchProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'mm_profile_fallback'

function getFallbackProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

function setFallbackProfile(profile: Profile | null) {
  if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  else localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(getFallbackProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error: e } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      setProfile(data as Profile)
      setFallbackProfile(data as Profile)
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({ user_id: uid })
        .select()
        .single()
      if (insertErr) {
        setError(insertErr.message)
        return
      }
      setProfile(inserted as Profile)
      setFallbackProfile(inserted as Profile)
    }
  }, [])

  const refetchProfile = useCallback(async () => {
    if (!user?.id) return
    await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  const setupRealtime = useCallback(
    (uid: string) => {
      channelRef.current?.unsubscribe()
      const channel = supabase
        .channel(`user_${uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
              setProfile(payload.new as Profile)
              setFallbackProfile(payload.new as Profile)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'swipes',
            filter: `user_id=eq.${uid}`,
          },
          () => {
            refetchProfile()
          }
        )
      channel.subscribe()
      channelRef.current = channel
    },
    [refetchProfile]
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setFallbackProfile(null)
        channelRef.current?.unsubscribe()
        channelRef.current = null
        setLoading(false)
        return
      }
      if (!session?.user?.id) {
        setLoading(false)
        return
      }
      setError(null)
      setLoading(true)
      // URGENT FIX: Prevent deadlock — don't block onAuthStateChange with async fetchProfile.
      // Run fetchProfile in next tick so the auth callback returns immediately.
      const id = setTimeout(() => {
        fetchProfile(session.user.id)
          .then(() => {
            setupRealtime(session.user.id)
            // Update login streak and identify user for analytics
            updateStreak(session.user.id).catch(console.error)
            identifyUser(session.user.id, { email: session.user.email })
          })
          .finally(() => {
            setLoading(false)
          })
      }, 0)
      return () => clearTimeout(id)
    })

    return () => {
      subscription.unsubscribe()
      channelRef.current?.unsubscribe()
    }
  }, [fetchProfile, setupRealtime])

  const signOut = useCallback(async () => {
    setError(null)
    await supabase.auth.signOut()
  }, [])

  const value: AuthState = {
    user,
    session,
    profile,
    loading,
    error,
    refetchProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
