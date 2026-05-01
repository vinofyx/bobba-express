import { Component } from 'react'
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

// ── Error Boundary — prevents blank page on uncaught render errors ────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', background: '#f8fafc' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,.1)', textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { window.localStorage.removeItem('token'); window.localStorage.removeItem('user'); window.location.href = '/login'; }}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Clear Session & Go to Login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Route guards ──────────────────────────────────────────────────────────────
function PublicRoute({ children }) {
  const { token, user } = useSelector((s) => s.auth)
  // Only redirect to app if BOTH token and user are present
  return (token && user) ? <Navigate to="/" replace /> : children
}

function DefaultRedirect() {
  const { token, user } = useSelector((s) => s.auth)
  if (!token || !user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'agent' ? '/agent' : '/dashboard'} replace />
}

// Role-gated route — if user or token is missing, always go to login (prevents redirect loop)
function RoleRoute({ roles, children }) {
  const { token, user } = useSelector((s) => s.auth)
  if (!token || !user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role))
    return <Navigate to={user.role === 'agent' ? '/agent' : '/dashboard'} replace />
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
    <ErrorBoundary>
      <Provider store={store}>
        <AppRoutes />
      </Provider>
    </ErrorBoundary>
  )
}
