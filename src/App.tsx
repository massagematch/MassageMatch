import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import Layout from '@/components/Layout'
import { ExitIntentPopup } from '@/components/ExitIntentPopup'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import { ChatBubble } from '@/components/ChatBubble'
import { AdminRoute } from '@/components/AdminRoute'
import { AdminFooterButton } from '@/components/AdminFooterButton'
import { ROUTES } from '@/constants/routes'

// ─── Lazy-loaded pages (see PROJECT_STRUCTURE.md for layout) ───
const Login = lazy(() => import('@/pages/Login'))
const Home = lazy(() => import('@/pages/Home'))
const Swipe = lazy(() => import('@/pages/Swipe'))
const Premium = lazy(() => import('@/pages/Premium'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Profile = lazy(() => import('@/pages/Profile'))
const UnlockedProfiles = lazy(() => import('@/pages/UnlockedProfiles'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'))
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'))
const AdminStripe = lazy(() => import('@/pages/admin/AdminStripe'))
const AdminImpersonate = lazy(() => import('@/pages/admin/AdminImpersonate'))
const PWAInstallPage = lazy(() => import('@/pages/PWAInstallPage'))
const Contact = lazy(() => import('@/pages/Contact'))
const TopPage = lazy(() => import('@/pages/TopPage'))
const CityPage = lazy(() => import('@/pages/cities/CityPage'))

function PageFallback() {
  return <div className="loading-screen">Loading…</div>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public (no auth) */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.INSTALL} element={<PWAInstallPage />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
        <Route path={ROUTES.TOP} element={<TopPage />} />
        {/* Protected (Layout + Realtime) */}
        <Route
          path={ROUTES.HOME}
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
          <Route path=":city" element={<CityPage />} />
        </Route>
        {/* Admin */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_REVIEWS}
          element={
            <AdminRoute>
              <AdminReviews />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_CONTENT}
          element={
            <AdminRoute>
              <AdminContent />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_STRIPE}
          element={
            <AdminRoute>
              <AdminStripe />
            </AdminRoute>
          }
        />
        <Route
          path={`${ROUTES.ADMIN}/impersonate/:userId`}
          element={
            <AdminRoute>
              <AdminImpersonate />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ExitIntentPopup />
      <WhatsAppButton />
      <PWAInstallBanner />
      <ChatBubble />
      <AdminFooterButton />
    </AuthProvider>
  )
}
