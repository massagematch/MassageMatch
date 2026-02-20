import React, { createContext, useContext } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const RealtimeContext = createContext<{ connected: boolean }>({ connected: false })

// Realtime subscription lives in AuthContext (single channel per user). Here we only expose status.
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const connected = Boolean(user?.id)

  return (
    <RealtimeContext.Provider value={{ connected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  return useContext(RealtimeContext)
}
