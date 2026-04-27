// Phase 6: Field Agent Panel — mobile-first, GPS capture (Phase 10)
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { pickupAPI } from '../api/pickupApi'
import { parcelsAPI } from '../api/parcels.api'

// ── Status colours ────────────────────────────────────────────────────────────
const PICKUP_BADGE = {
  Requested: { bg: '#dbeafe', color: '#1d4ed8' },
  Assigned:  { bg: '#ede9fe', color: '#6d28d9' },
  Picked:    { bg: '#d1fae5', color: '#065f46' },
  Failed:    { bg: '#fee2e2', color: '#991b1b' },
}
const PARCEL_BADGE = {
  Pending:      { bg: '#f1f5f9', color: '#475569' },
  'In Pickup':  { bg: '#fef3c7', color: '#92400e' },
  'At Center':  { bg: '#cffafe', color: '#155e75' },
  'In Transit': { bg: '#ede9fe', color: '#5b21b6' },
  Delivered:    { bg: '#dcfce7', color: '#14532d' },
  Returned:     { bg: '#fee2e2', color: '#991b1b' },
}

const inp = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const PARCEL_STATUSES = ['In Pickup', 'At Center', 'In Transit', 'Delivered', 'Returned']
const PARCEL_TYPES    = ['document', 'parcel', 'fragile', 'electronics', 'bulk']

// ── GPS helper ────────────────────────────────────────────────────────────────
const getGPS = () => new Promise(resolve => {
  if (!navigator.geolocation) return resolve(null)
  navigator.geolocation.getCurrentPosition(
    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    ()  => resolve(null),
    { enableHighAccuracy: true, timeout: 6000 },
  )
})

// ── Parcel Detail Modal ───────────────────────────────────────────────────────
function ParcelModal({ pickup, onClose, onCreated }) {
  const [form, setForm] = useState({
    weight: '', length: '', width: '', height: '',
    type: pickup?.parcelType || 'parcel',
    quantity: '1', codAmount: '',
  })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [gpsInfo, setGpsInfo] = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.weight || isNaN(form.weight) || Number(form.weight) <= 0) {
      setError('Weight is required and must be a positive number.'); return
    }
    setSaving(true); setError('')
    setGpsInfo('Getting GPS location…')
    try {
      const gps = await getGPS()
      setGpsInfo(gps ? `GPS captured: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS unavailable — continuing without it')

      const payload = {
        pickupId:  pickup._id,
        weight:    Number(form.weight),
        type:      form.type,
        quantity:  Number(form.quantity) || 1,
        codAmount: Number(form.codAmount) || 0,
      }
      if (form.length && form.width && form.height) {
        payload.dimensions = {
          length: Number(form.length),
          width:  Number(form.width),
          height: Number(form.height),
        }
      }
      if (gps) payload.gps = gps

      const res = await parcelsAPI.createFromPickup(payload)
      onCreated(res.data?.data?.parcel)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create parcel.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Enter Parcel Details</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
        </div>

        {/* Pickup summary */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 18, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{pickup?.customer?.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {pickup?.pickupAddress?.line1}, {pickup?.pickupAddress?.city}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#b91c1c' }}>{error}</div>
        )}
        {gpsInfo && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: '#166534' }}>
            📍 {gpsInfo}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Weight */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Weight (kg) *</label>
            <input style={inp} type="number" step="0.1" min="0.1" value={form.weight} onChange={set('weight')} placeholder="e.g. 2.5" required />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Parcel Type</label>
            <select style={inp} value={form.type} onChange={set('type')}>
              {PARCEL_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {/* Dimensions */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Dimensions (cm) — optional</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.length} onChange={set('length')} placeholder="L" />
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.width}  onChange={set('width')}  placeholder="W" />
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.height} onChange={set('height')} placeholder="H" />
            </div>
          </div>

          {/* Quantity & COD */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Quantity</label>
              <input style={inp} type="number" min="1" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>COD Amount (₹)</label>
              <input style={inp} type="number" min="0" value={form.codAmount} onChange={set('codAmount')} placeholder="0" />
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            marginTop: 6, padding: '14px', border: 'none', borderRadius: 12,
            background: saving ? '#a5b4fc' : '#10b981', color: '#fff',
            fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
            {saving ? 'Creating Parcel…' : '✓ Confirm Pickup & Create Parcel'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Agent Page ───────────────────────────────────────────────────────────
export default function AgentPage() {
  const dispatch      = useDispatch()
  const { user }      = useSelector(s => s.auth)
  const [tab, setTab] = useState('pickups')

  const [pickups, setPickups]   = useState([])
  const [parcels, setParcels]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)
  const [gpsToast, setGpsToast] = useState('')

  // Parcel detail modal
  const [parcelModal, setParcelModal] = useState(null) // pickup object

  const showGPS = msg => {
    setGpsToast(msg)
    setTimeout(() => setGpsToast(''), 4000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pr, pa] = await Promise.all([
        pickupAPI.getAll({ onlyMine: true }),
        parcelsAPI.getAll({ onlyMine: true }),
      ])
      const myId = user?._id
      setPickups((pr.data?.data?.pickups || []).filter(p => p.assignedAgent?._id === myId || p.assignedAgent === myId))
      setParcels((pa.data?.data?.parcels || []).filter(p => p.assignedAgent?._id === myId || p.assignedAgent === myId))
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // ── Mark pickup failed ────────────────────────────────────────────────────
  const handleFail = async (id) => {
    if (!window.confirm('Mark this pickup as Failed?')) return
    setUpdating(id)
    try {
      const gps = await getGPS()
      showGPS(gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS unavailable')
      await pickupAPI.updateStatus(id, { status: 'Failed', gps, note: `Marked failed by ${user?.name}` })
      setPickups(prev => prev.map(p => p._id === id ? { ...p, status: 'Failed' } : p))
    } catch { alert('Failed to update status.') }
    finally { setUpdating(null) }
  }

  // ── After parcel created ──────────────────────────────────────────────────
  const handleParcelCreated = (parcel) => {
    // pickup is now "Picked" — update locally
    setPickups(prev => prev.map(p => p._id === parcel.pickupId ? { ...p, status: 'Picked' } : p))
    setParcels(prev => [parcel, ...prev])
    setParcelModal(null)
    setTab('parcels')
    showGPS('Parcel created! Switched to Parcels tab.')
  }

  // ── Update parcel status ──────────────────────────────────────────────────
  const handleParcelStatus = async (id, status) => {
    setUpdating(id)
    showGPS('Getting GPS location…')
    try {
      const gps = await getGPS()
      showGPS(gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS unavailable')
      await parcelsAPI.updateStatus(id, { status, gps, note: `Updated by agent ${user?.name}` })
      setParcels(prev => prev.map(p => p._id === id ? { ...p, status } : p))
    } catch { alert('Failed to update parcel status.') }
    finally { setUpdating(null) }
  }

  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const doneCount = pickups.filter(p => p.status === 'Picked').length +
                    parcels.filter(p => p.status === 'Delivered').length

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui,sans-serif', maxWidth: 480, margin: '0 auto', position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '20px 20px 0', color: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -.3 }}>Agent Panel</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Welcome, {user?.name || 'Agent'}</div>
          </div>
          <button onClick={() => dispatch(logout())} style={{
            padding: '8px 14px', border: '1.5px solid rgba(255,255,255,.35)',
            borderRadius: 9, background: 'rgba(255,255,255,.1)',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Logout</button>
        </div>

        {/* GPS toast */}
        {gpsToast && (
          <div style={{ marginTop: 10, background: 'rgba(255,255,255,.18)', borderRadius: 8, padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📍</span><span>{gpsToast}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, margin: '16px 0 0' }}>
          {[
            ['Pickups', pickups.length, '#93c5fd'],
            ['Parcels', parcels.length, '#6ee7b7'],
            ['Done',    doneCount,      '#fcd34d'],
          ].map(([label, val, clr]) => (
            <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.13)', borderRadius: 10, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: clr, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginTop: 14 }}>
          {['pickups', 'parcels'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
              borderBottom: tab === t ? '3px solid #fff' : '3px solid transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,.55)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {t} ({t === 'pickups' ? pickups.length : parcels.length})
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>Loading your assignments…</div>
        ) : tab === 'pickups' ? (

          /* ── PICKUPS TAB ── */
          pickups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No pickups assigned to you</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Check back after your manager assigns a pickup.</div>
            </div>
          ) : pickups.map(p => {
            const b     = PICKUP_BADGE[p.status] || { bg: '#f1f5f9', color: '#475569' }
            const isDone = p.status === 'Picked' || p.status === 'Failed'
            return (
              <div key={p._id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: isDone ? 'none' : '1.5px solid #e0e7ff' }}>

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, paddingRight: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{p.customer?.name || '—'}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{p.customer?.phone || ''}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: b.bg, color: b.color, whiteSpace: 'nowrap' }}>{p.status}</span>
                </div>

                {/* Address */}
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{p.pickupAddress?.line1}</div>
                  {p.pickupAddress?.line2 && <div style={{ fontSize: 12, color: '#64748b' }}>{p.pickupAddress.line2}</div>}
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{p.pickupAddress?.city}, {p.pickupAddress?.state} — {p.pickupAddress?.pincode}</div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                  <span>📅 {fmt(p.scheduledDate)}</span>
                  <span>⏰ {p.pickupTime}</span>
                  <span style={{ textTransform: 'capitalize' }}>📦 {p.parcelType}</span>
                </div>

                {/* Action buttons */}
                {isDone ? (
                  <div style={{ fontSize: 13, color: p.status === 'Picked' ? '#059669' : '#dc2626', fontWeight: 600, padding: '8px 0' }}>
                    {p.status === 'Picked' ? '✓ Pickup completed — parcel created' : '✗ Pickup failed'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setParcelModal(p)}
                      disabled={updating === p._id}
                      style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      📋 Enter Parcel Details
                    </button>
                    <button
                      onClick={() => handleFail(p._id)}
                      disabled={updating === p._id}
                      style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ✗ Fail
                    </button>
                  </div>
                )}
              </div>
            )
          })

        ) : (

          /* ── PARCELS TAB ── */
          parcels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No parcels yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Parcels appear here after you enter pickup details.</div>
            </div>
          ) : parcels.map(p => {
            const b = PARCEL_BADGE[p.status] || { bg: '#f1f5f9', color: '#475569' }
            return (
              <div key={p._id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>

                {/* Tracking ID + customer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#4f46e5', letterSpacing: .5 }}>{p.trackingId}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>{p.customer?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.customer?.phone}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: b.bg, color: b.color, whiteSpace: 'nowrap' }}>{p.status}</span>
                </div>

                {/* Parcel info */}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                  <span>⚖️ {p.weight}kg</span>
                  <span style={{ textTransform: 'capitalize' }}>📦 {p.type}</span>
                  {p.codAmount > 0 && <span>💰 COD ₹{p.codAmount}</span>}
                  <span>🔖 {p.barcode?.slice(0, 8)}…</span>
                </div>

                {/* Status selector */}
                {p.status !== 'Delivered' && p.status !== 'Returned' ? (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Update Status</label>
                    <select
                      value={p.status}
                      disabled={updating === p._id}
                      onChange={e => handleParcelStatus(p._id, e.target.value)}
                      style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a' }}
                    >
                      {PARCEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updating === p._id && (
                      <div style={{ fontSize: 12, color: '#6366f1', marginTop: 6 }}>Updating with GPS…</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: p.status === 'Delivered' ? '#059669' : '#dc2626', fontWeight: 600, padding: '6px 0' }}>
                    {p.status === 'Delivered' ? '✓ Delivered successfully' : '✗ Returned'}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Parcel Detail Modal (bottom sheet) ── */}
      {parcelModal && (
        <ParcelModal
          pickup={parcelModal}
          onClose={() => setParcelModal(null)}
          onCreated={handleParcelCreated}
        />
      )}
    </div>
  )
}
