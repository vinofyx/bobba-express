import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useSelector } from 'react-redux'
import store from './store'
import AuthPage      from './pages/AuthPage'
import Layout        from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import PickupsPage   from './pages/PickupsPage'
import ParcelsPage   from './pages/ParcelsPage'
import ShipmentsPage from './pages/ShipmentsPage'
import AgentPage     from './pages/AgentPage'
import TrackingPage  from './pages/TrackingPage'

function PrivateRoute({ children }) {
  const token = useSelector((s) => s.auth.token)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const token = useSelector((s) => s.auth.token)
  return token ? <Navigate to="/" replace /> : children
}

function DefaultRedirect() {
  const user = useSelector((s) => s.auth.user)
  return <Navigate to={user?.role === 'agent' ? '/agent' : '/dashboard'} replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Phase 3: Auth — public */}
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* Phase 8: Tracking — public, no login required */}
        <Route path="/tracking" element={<TrackingPage />} />

        {/* Phase 6: Agent panel — full-screen mobile view */}
        <Route path="/agent" element={<PrivateRoute><AgentPage /></PrivateRoute>} />

        {/* Phase 4-5-7-9-13: Admin / Staff — sidebar layout */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DefaultRedirect />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="pickups"    element={<PickupsPage />} />
          <Route path="parcels"    element={<ParcelsPage />} />
          <Route path="shipments"  element={<ShipmentsPage />} />
        </Route>

        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  )
}
