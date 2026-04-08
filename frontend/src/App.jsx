import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './services/api'
import useAuthStore from './store/authStore'
import useAppStore from './store/appStore'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Properties from './pages/RealEstate/Properties'
import Tenants from './pages/RealEstate/Tenants'
import RentPayments from './pages/RealEstate/RentPayments'
import Maintenance from './pages/RealEstate/Maintenance'
import Crops from './pages/Farm/Crops'
import Harvests from './pages/Farm/Harvests'
import Buyers from './pages/Farm/Buyers'
import Orders from './pages/Farm/Orders'
import FarmExpenses from './pages/Farm/FarmExpenses'
import PlantingCalendar from './pages/Farm/PlantingCalendar'
import Certifications from './pages/Farm/Certifications'
import FinanceHub from './pages/Finance/FinanceHub'
import AIAssistant from './pages/AI/AIAssistant'
import NotificationCenter from './pages/Notifications/NotificationCenter'
import Settings from './pages/Settings/Settings'
import LoadingSpinner from './components/UI/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { setSession, setLoading, fetchProfile } = useAuthStore()
  const { initDarkMode } = useAppStore()

  useEffect(() => {
    initDarkMode()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Real Estate */}
        <Route path="real-estate/properties" element={<Properties />} />
        <Route path="real-estate/tenants" element={<Tenants />} />
        <Route path="real-estate/rent-payments" element={<RentPayments />} />
        <Route path="real-estate/maintenance" element={<Maintenance />} />

        {/* Farm */}
        <Route path="farm/crops" element={<Crops />} />
        <Route path="farm/harvests" element={<Harvests />} />
        <Route path="farm/buyers" element={<Buyers />} />
        <Route path="farm/orders" element={<Orders />} />
        <Route path="farm/expenses" element={<FarmExpenses />} />
        <Route path="farm/calendar" element={<PlantingCalendar />} />
        <Route path="farm/certifications" element={<Certifications />} />

        {/* Finance */}
        <Route path="finance" element={<FinanceHub />} />

        {/* AI */}
        <Route path="ai" element={<AIAssistant />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationCenter />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
