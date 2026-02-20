import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Swipe from '@/pages/Swipe'
import Premium from '@/pages/Premium'
import Pricing from '@/pages/Pricing'
import Dashboard from '@/pages/Dashboard'
import FAQ from '@/pages/FAQ'
import Profile from '@/pages/Profile'
import UnlockedProfiles from '@/pages/UnlockedProfiles'
import { ExitIntentPopup } from '@/components/ExitIntentPopup'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { ChatBubble } from '@/components/ChatBubble'
import { SEOHead } from '@/components/SEOHead'
import { AdminRoute } from '@/components/AdminRoute'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminContent from '@/pages/admin/AdminContent'
import AdminStripe from '@/pages/admin/AdminStripe'
import AdminImpersonate from '@/pages/admin/AdminImpersonate'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RealtimeProvider>
              <Layout />
            </RealtimeProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="swipe" element={<Swipe />} />
        <Route path="premium" element={<Premium />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="unlocked-profiles" element={<UnlockedProfiles />} />
        <Route path="faq" element={<FAQ />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <AdminRoute>
            <AdminReviews />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <AdminRoute>
            <AdminContent />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/stripe"
        element={
          <AdminRoute>
            <AdminStripe />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/impersonate/:userId"
        element={
          <AdminRoute>
            <AdminImpersonate />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SEOHead />
      <AppRoutes />
      <ExitIntentPopup />
      <WhatsAppButton />
      <PWAInstallPrompt />
      <ChatBubble />
    </AuthProvider>
  )
}
