import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['admin','staff'] },
  { to: '/customers', label: 'Customers', icon: '◎', roles: ['admin','staff'] },
  { to: '/pickups',   label: 'Pickups',   icon: '◈', roles: ['admin','staff'] },
  { to: '/parcels',   label: 'Parcels',   icon: '▣', roles: ['admin','staff'] },
  { to: '/shipments', label: 'Shipments', icon: '◩', roles: ['admin','staff'] },
  { to: '/tracking',  label: 'Tracking',  icon: '📍', roles: ['admin','staff'] },
  { to: '/users',     label: 'Users',     icon: '◉', roles: ['admin'] },
]

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user     = useSelector((s) => s.auth.user)

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const ROLE_COLORS = { admin: { bg: '#172554', color: '#60a5fa' }, staff: { bg: '#1e3a5f', color: '#38bdf8' }, agent: { bg: '#14532d', color: '#4ade80' } }
  const rc = ROLE_COLORS[user?.role] || ROLE_COLORS.staff

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui,sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>

        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>B</div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>Bobba Express</div>
              <div style={{ color: '#475569', fontSize: 11 }}>Logistics Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {NAV.filter(({ roles }) => roles.includes(user?.role)).map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#4f46e5' : 'transparent',
                transition: 'all .15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{user?.name || 'User'}</div>
          <div style={{ display: 'inline-block', marginBottom: 12, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.color, textTransform: 'capitalize' }}>{user?.role}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px 0', border: 'none', borderRadius: 8, background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 36px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
