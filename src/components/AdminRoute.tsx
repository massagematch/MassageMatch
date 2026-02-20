import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin } from '@/lib/admin'
import AdminLogin from '@/pages/admin/AdminLogin'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }
      try {
        const admin = await isSuperAdmin()
        setIsAdmin(admin)
      } catch {
        setIsAdmin(false)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [user])

  if (authLoading || checking) {
    return <div className="admin-loading">Checking access...</div>
  }

  if (!user) {
    return <AdminLogin />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
