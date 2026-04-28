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
import UsersPage     from './pages/UsersPage'

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

// Phase 12: Role-gated route — redirects if user lacks required role
function RoleRoute({ roles, children }) {
  const { token, user } = useSelector((s) => s.auth)
  if (!token) return <Navigate to="/login" replace />
  if (!roles.includes(user?.role))
    return <Navigate to={user?.role === 'agent' ? '/agent' : '/dashboard'} replace />
  return children
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — public */}
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* Tracking — public, no login required */}
        <Route path="/tracking" element={<TrackingPage />} />

        {/* Agent panel — agents only, full-screen mobile view */}
        <Route path="/agent" element={
          <RoleRoute roles={['agent','admin','staff']}>
            <AgentPage />
          </RoleRoute>
        } />

        {/* Admin / Staff — sidebar layout */}
        <Route path="/" element={
          <RoleRoute roles={['admin','staff']}>
            <Layout />
          </RoleRoute>
        }>
          <Route index element={<DefaultRedirect />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="pickups"    element={<PickupsPage />} />
          <Route path="parcels"    element={<ParcelsPage />} />
          <Route path="shipments"  element={<ShipmentsPage />} />
          <Route path="users"      element={
            <RoleRoute roles={['admin']}>
              <UsersPage />
            </RoleRoute>
          } />
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
