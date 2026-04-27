import { useEffect, useState } from 'react'
import { shipmentsAPI } from '../api/shipments.api'
import { parcelsAPI }   from '../api/parcels.api'

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTER_TABS = ['All', 'Created', 'Dispatched', 'Received', 'Cancelled']

const STATUS_COLORS = {
  Created:     { bg: '#f1f5f9', color: '#475569'  },
  Dispatched:  { bg: '#dbeafe', color: '#1d4ed8'  },
  'In Transit':{ bg: '#ede9fe', color: '#6d28d9'  },
  Received:    { bg: '#d1fae5', color: '#065f46'  },
  Cancelled:   { bg: '#fee2e2', color: '#991b1b'  },
}

const PARCEL_STATUS_COLORS = {
  'At Center':  { bg: '#dbeafe', color: '#1d4ed8' },
  'In Transit': { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:    { bg: '#d1fae5', color: '#065f46' },
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const fmt     = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtFull = d => d ? new Date(d).toLocaleString  ('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// ── Shared modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', width: wide ? 680 : 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Shipment Detail Modal ─────────────────────────────────────────────────────
function ShipmentDetail({ id, onClose, onAction }) {
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState(false)

  useEffect(() => {
    shipmentsAPI.getById(id)
      .then(r => setShipment(r.data?.data?.shipment))
      .catch(() => alert('Failed to load shipment.'))
      .finally(() => setLoading(false))
  }, [id])

  const doDispatch = async () => {
    if (!window.confirm('Dispatch this shipment? All parcels will be marked In Transit.')) return
    setActing(true)
    try {
      await shipmentsAPI.dispatch(id, 'Dispatched from origin hub.')
      onAction(); onClose()
    } catch (err) { alert(err?.response?.data?.message || 'Failed.') }
    finally { setActing(false) }
  }

  const doReceive = async () => {
    if (!window.confirm('Mark shipment as Received? All parcels will be marked At Center at destination.')) return
    setActing(true)
    try {
      await shipmentsAPI.receive(id, 'Received at destination hub.')
      onAction(); onClose()
    } catch (err) { alert(err?.response?.data?.message || 'Failed.') }
    finally { setActing(false) }
  }

  if (loading) return (
    <Modal title="Shipment Details" onClose={onClose} wide>
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
    </Modal>
  )
  if (!shipment) return null

  const sc = STATUS_COLORS[shipment.status] || { bg: '#f1f5f9', color: '#475569' }

  return (
    <Modal title={`Shipment — ${shipment.shipmentId}`} onClose={onClose} wide>

      {/* ── Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          ['Status',      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>{shipment.status}</span>],
          ['Vehicle',     shipment.vehicleNumber],
          ['Driver',      shipment.driver?.name],
          ['Driver Phone',shipment.driver?.phone || '—'],
          ['Origin Hub',  shipment.originHub || '—'],
          ['Dest. Hub',   shipment.destinationHub || '—'],
          ['Dispatched',  fmtFull(shipment.dispatchedAt)],
          ['Received',    fmtFull(shipment.receivedAt)],
          ['Created by',  shipment.createdBy?.name || '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── Parcel list ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
          Parcels ({shipment.parcels?.length})
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {shipment.parcels?.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No parcels</div>
          ) : shipment.parcels.map((p, i) => {
            const ps = PARCEL_STATUS_COLORS[p.status] || { bg: '#f1f5f9', color: '#475569' }
            return (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < shipment.parcels.length - 1 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{p.trackingId}</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.color }}>{p.status}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Status History ── */}
      {shipment.statusHistory?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Status History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...shipment.statusHistory].reverse().map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{h.status}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {h.location && `${h.location} · `}{fmtFull(h.timestamp)}
                  </div>
                  {h.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {shipment.status === 'Created' && (
          <button onClick={doDispatch} disabled={acting} style={{
            flex: 1, padding: 12, border: 'none', borderRadius: 10,
            background: acting ? '#bfdbfe' : '#1d4ed8', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>{acting ? 'Dispatching…' : '🚚 Dispatch Shipment'}</button>
        )}
        {shipment.status === 'Dispatched' && (
          <button onClick={doReceive} disabled={acting} style={{
            flex: 1, padding: 12, border: 'none', borderRadius: 10,
            background: acting ? '#bbf7d0' : '#059669', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>{acting ? 'Receiving…' : '🏭 Mark as Received'}</button>
        )}
        {(shipment.status === 'Received' || shipment.status === 'Cancelled') && (
          <div style={{ flex: 1, padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
            {shipment.status === 'Received' ? '✓ Shipment completed' : '✗ Shipment cancelled'}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Create Shipment Modal ─────────────────────────────────────────────────────
function CreateModal({ atCenter, onClose, onCreated }) {
  const [form, setForm]   = useState({ vehicleNumber: '', driverName: '', driverPhone: '', originHub: '', destinationHub: '', parcelIds: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const toggle = id => setForm(p => ({
    ...p,
    parcelIds: p.parcelIds.includes(id)
      ? p.parcelIds.filter(x => x !== id)
      : [...p.parcelIds, id],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.parcelIds.length) { setError('Select at least one parcel.'); return }
    setSaving(true); setError('')
    try {
      await shipmentsAPI.create({
        parcelIds:      form.parcelIds,
        vehicleNumber:  form.vehicleNumber,
        driver:         { name: form.driverName, phone: form.driverPhone || undefined },
        originHub:      form.originHub      || undefined,
        destinationHub: form.destinationHub || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create shipment.')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Create Shipment" onClose={onClose} wide>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Vehicle + Driver */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Vehicle Number *</label>
            <input style={inp} value={form.vehicleNumber} onChange={set('vehicleNumber')} required placeholder="MH12AB1234" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Driver Name *</label>
            <input style={inp} value={form.driverName} onChange={set('driverName')} required placeholder="Suresh Kumar" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Driver Phone</label>
            <input style={inp} value={form.driverPhone} onChange={set('driverPhone')} placeholder="9876543210" />
          </div>
        </div>

        {/* Hubs */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Origin Hub</label>
            <input style={inp} value={form.originHub} onChange={set('originHub')} placeholder="e.g. Mumbai Hub" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Destination Hub</label>
            <input style={inp} value={form.destinationHub} onChange={set('destinationHub')} placeholder="e.g. Pune Hub" />
          </div>
        </div>

        {/* Parcel multi-select */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              Batch Parcels (At Center) *
            </label>
            <span style={{ fontSize: 12, color: form.parcelIds.length ? '#4f46e5' : '#94a3b8', fontWeight: 600 }}>
              {form.parcelIds.length} selected
            </span>
          </div>

          {atCenter.length === 0 ? (
            <div style={{ padding: 20, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No parcels at center</div>
              <div>Parcels must have status <strong>"At Center"</strong> to be added to a shipment.<br />Update a parcel's status from the Parcels page first.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setForm(p => ({ ...p, parcelIds: atCenter.map(p => p._id) }))}
                  style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>
                  Select All
                </button>
                <button type="button" onClick={() => setForm(p => ({ ...p, parcelIds: [] }))}
                  style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>
                  Clear
                </button>
              </div>
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, maxHeight: 220, overflowY: 'auto' }}>
                {atCenter.map((p, i) => (
                  <label key={p._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                    borderBottom: i < atCenter.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer', background: form.parcelIds.includes(p._id) ? '#eef2ff' : '#fff',
                    transition: 'background .1s',
                  }}>
                    <input type="checkbox" checked={form.parcelIds.includes(p._id)} onChange={() => toggle(p._id)} style={{ accentColor: '#4f46e5' }} />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{p.trackingId}</span>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>{p.customer?.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.weight} kg · {p.type}</span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
          On dispatch: all selected parcels → <strong>In Transit</strong> + TrackingLog entries created automatically.
        </div>

        <button type="submit" disabled={saving || atCenter.length === 0} style={{
          padding: 12, border: 'none', borderRadius: 10,
          background: saving || atCenter.length === 0 ? '#a5b4fc' : '#4f46e5',
          color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: saving || atCenter.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>{saving ? 'Creating Shipment…' : 'Create Shipment'}</button>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([])
  const [atCenter, setAtCenter]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('All')

  const [showCreate, setShowCreate]   = useState(false)
  const [detailId, setDetailId]       = useState(null)

  const fetchShipments = () => {
    setLoading(true)
    shipmentsAPI.getAll()
      .then(r => setShipments(r.data?.data?.shipments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchAtCenter = () => {
    parcelsAPI.getAll({ status: 'At Center' })
      .then(r => setAtCenter(r.data?.data?.parcels ?? []))
      .catch(() => {})
  }

  useEffect(() => { fetchShipments(); fetchAtCenter() }, [])

  const handleCreated = () => { setShowCreate(false); fetchShipments(); fetchAtCenter() }
  const handleAction  = () => { fetchShipments(); fetchAtCenter() }

  const filtered = filter === 'All' ? shipments : shipments.filter(s => s.status === filter)

  // Summary counts
  const counts = FILTER_TABS.slice(1).reduce((acc, s) => {
    acc[s] = shipments.filter(sh => sh.status === s).length
    return acc
  }, {})

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Shipments</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{shipments.length} total · {atCenter.length} parcel{atCenter.length !== 1 ? 's' : ''} at center ready to ship</p>
        </div>
        <button onClick={() => { fetchAtCenter(); setShowCreate(true) }} style={{
          padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
          background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
        }}>+ Create Shipment</button>
      </div>

      {/* ── Stat chips ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([status, count]) => {
          const sc = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569' }
          return (
            <div key={status} style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', minWidth: 110, borderLeft: `3px solid ${sc.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: sc.color }}>{count}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{status}</div>
            </div>
          )
        })}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            background: filter === t ? '#4f46e5' : '#fff',
            color: filter === t ? '#fff' : '#64748b',
            boxShadow: filter === t ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
          }}>{t}{t !== 'All' && ` (${counts[t] ?? 0})`}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading shipments…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚚</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {filter === 'All' ? 'No shipments yet.' : `No ${filter} shipments.`}
            </div>
            {filter === 'All' && (
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Update parcel statuses to <strong>"At Center"</strong>, then create a shipment to batch them.
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Shipment ID', 'Parcels', 'Vehicle', 'Driver', 'Route', 'Dispatched', 'Received', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const sc = STATUS_COLORS[s.status] || { bg: '#f1f5f9', color: '#475569' }
                  return (
                    <tr key={s._id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <button onClick={() => setDetailId(s._id)} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                          {s.shipmentId}
                        </button>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', fontSize: 13, fontWeight: 800 }}>
                          {s.parcels?.length ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.vehicleNumber}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.driver?.name}</div>
                        {s.driver?.phone && <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.driver.phone}</div>}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {s.originHub || '—'} → {s.destinationHub || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(s.dispatchedAt)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(s.receivedAt)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{s.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setDetailId(s._id)} style={{
                            padding: '5px 10px', border: 'none', borderRadius: 7,
                            background: '#eef2ff', color: '#4f46e5', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                          }}>View</button>
                          {s.status === 'Created' && (
                            <button onClick={() => setDetailId(s._id)} style={{
                              padding: '5px 10px', border: 'none', borderRadius: 7,
                              background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                            }}>Dispatch</button>
                          )}
                          {s.status === 'Dispatched' && (
                            <button onClick={() => setDetailId(s._id)} style={{
                              padding: '5px 10px', border: 'none', borderRadius: 7,
                              background: '#d1fae5', color: '#065f46', cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                            }}>Receive</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && <CreateModal atCenter={atCenter} onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {detailId   && <ShipmentDetail id={detailId} onClose={() => setDetailId(null)} onAction={handleAction} />}
    </div>
  )
}
