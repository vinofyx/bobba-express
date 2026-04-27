import { useEffect, useState } from 'react'
import { parcelsAPI } from '../api/parcels.api'
import { pickupAPI }  from '../api/pickupApi'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES     = ['All', 'Pending', 'In Pickup', 'At Center', 'In Transit', 'Delivered', 'Returned']
const PARCEL_TYPES = ['document', 'parcel', 'fragile', 'electronics', 'bulk']

const STATUS_COLORS = {
  Pending:      { bg: '#f1f5f9', color: '#475569' },
  'In Pickup':  { bg: '#fef9c3', color: '#854d0e' },
  'At Center':  { bg: '#dbeafe', color: '#1d4ed8' },
  'In Transit': { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:    { bg: '#d1fae5', color: '#065f46' },
  Returned:     { bg: '#fee2e2', color: '#991b1b' },
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

// ── Barcode renderer (SVG — no extra library needed) ──────────────────────────
// Converts UUID string → visual Code-128-style bars using hex char values
function BarcodeDisplay({ value }) {
  if (!value) return null

  const hex   = value.replace(/-/g, '')           // strip dashes → 32 hex chars
  const bars  = []

  // quiet zone + start guard
  bars.push({ w: 10, dark: false })
  bars.push({ w: 2, dark: true }); bars.push({ w: 1, dark: false }); bars.push({ w: 2, dark: true })

  // encode each hex nibble as a bar pattern
  for (let i = 0; i < hex.length; i++) {
    const n    = parseInt(hex[i], 16)          // 0–15
    const wide = n > 7                         // 8–15 → wide bar
    bars.push({ w: wide ? 3 : 1, dark: true  })
    bars.push({ w: 1,            dark: false })
    bars.push({ w: ((n % 4) + 1), dark: true })
    bars.push({ w: 1,             dark: false })
  }

  // stop guard + quiet zone
  bars.push({ w: 2, dark: true }); bars.push({ w: 1, dark: false }); bars.push({ w: 3, dark: true })
  bars.push({ w: 10, dark: false })

  const SCALE  = 1.4
  const HEIGHT = 64
  let totalW = bars.reduce((s, b) => s + b.w, 0) * SCALE
  let x = 0

  const rects = bars.map((b, i) => {
    const rect = b.dark
      ? <rect key={i} x={x} y={0} width={b.w * SCALE} height={HEIGHT} fill="#0f172a" />
      : null
    x += b.w * SCALE
    return rect
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={totalW} height={HEIGHT} style={{ display: 'block' }}>
        {rects}
      </svg>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', letterSpacing: .3 }}>
        {value}
      </div>
    </div>
  )
}

// ── Generic modal wrapper ─────────────────────────────────────────────────────
function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', width: wide ? 620 : 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Parcel detail modal (Phase 7: barcode display) ────────────────────────────
function ParcelDetail({ parcel, onClose }) {
  const fmt  = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const b    = STATUS_COLORS[parcel.status] || { bg: '#f1f5f9', color: '#475569' }

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=400,height=500')
    w.document.write(`
      <html><head><title>Parcel Label — ${parcel.trackingId}</title>
      <style>
        body { font-family: monospace; padding: 24px; }
        h2   { font-size: 16px; margin: 0 0 8px; }
        .sub { font-size: 11px; color: #555; margin-bottom: 16px; }
        svg  { display: block; margin: 0 auto 6px; }
        .tid { font-size: 13px; text-align: center; font-weight: bold; margin-bottom: 4px; }
        .bc  { font-size: 9px;  text-align: center; word-break: break-all; }
        hr   { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
        .row { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
      </style></head><body>
      <h2>Bobba Express</h2>
      <div class="sub">Parcel Shipping Label</div>
      <hr/>
      <div class="tid">${parcel.trackingId}</div>
      <div id="bc-container"></div>
      <div class="bc">${parcel.barcode || ''}</div>
      <hr/>
      <div class="row"><span>Customer</span><span>${parcel.customer?.name || '—'}</span></div>
      <div class="row"><span>Weight</span><span>${parcel.weight} kg</span></div>
      <div class="row"><span>Type</span><span>${parcel.type}</span></div>
      ${parcel.codAmount > 0 ? `<div class="row"><span>COD</span><span>₹${parcel.codAmount}</span></div>` : ''}
      <div class="row"><span>Created</span><span>${fmt(parcel.createdAt)}</span></div>
      <hr/>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `)
    w.document.close()
  }

  return (
    <Modal title="Parcel Details" onClose={onClose} wide>
      {/* ── Barcode section ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 16px', marginBottom: 20, overflowX: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Barcode</div>
        <BarcodeDisplay value={parcel.barcode} />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#4f46e5', letterSpacing: 1 }}>{parcel.trackingId}</span>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          ['Customer',    parcel.customer?.name || '—'],
          ['Phone',       parcel.customer?.phone || '—'],
          ['Status',      parcel.status],
          ['Location',    parcel.currentLocation || '—'],
          ['Weight',      `${parcel.weight} kg`],
          ['Type',        parcel.type],
          ['Quantity',    parcel.quantity || 1],
          ['COD',         parcel.codAmount > 0 ? `₹${parcel.codAmount}` : 'No COD'],
          ['Created',     fmt(parcel.createdAt)],
          ['Agent',       parcel.assignedAgent?.name || 'Unassigned'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', textTransform: label === 'Type' ? 'capitalize' : 'none' }}>
              {label === 'Status'
                ? <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, background: b.bg, color: b.color }}>{val}</span>
                : val}
            </div>
          </div>
        ))}
      </div>

      {/* Dimensions if present */}
      {parcel.dimensions?.length && (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Dimensions</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {parcel.dimensions.length} × {parcel.dimensions.width} × {parcel.dimensions.height} cm
          </div>
        </div>
      )}

      {/* ── Status history ── */}
      {parcel.statusHistory?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>Status History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...parcel.statusHistory].reverse().map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{h.status}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {h.location && `${h.location} · `}
                    {new Date(h.timestamp).toLocaleString('en-IN')}
                  </div>
                  {h.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{h.note}</div>}
                  {h.gps && <div style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace' }}>GPS: {h.gps.lat.toFixed(4)}, {h.gps.lng.toFixed(4)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Print button ── */}
      <button onClick={handlePrint} style={{
        width: '100%', marginTop: 20, padding: 12, border: '1.5px solid #e2e8f0',
        borderRadius: 10, background: '#fff', color: '#475569', fontWeight: 700,
        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        🖨️ Print Shipping Label
      </button>
    </Modal>
  )
}

// ── Create Parcel Form ────────────────────────────────────────────────────────
const EMPTY_PARCEL = { pickupId: '', weight: '', length: '', width: '', height: '', type: 'parcel', quantity: '1', codAmount: '' }

function CreateParcelModal({ onClose, onCreated }) {
  const [pickups, setPickups]     = useState([])
  const [form, setForm]           = useState(EMPTY_PARCEL)
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    pickupAPI.getAll()
      .then(r => setPickups((r.data?.data?.pickups ?? []).filter(p => p.status === 'Assigned' || p.status === 'Requested')))
      .catch(() => {})
  }, [])

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.pickupId)  { setError('Select a pickup.'); return }
    if (!form.weight || Number(form.weight) <= 0) { setError('Weight must be a positive number.'); return }
    setCreating(true); setError('')
    try {
      const payload = {
        pickupId:  form.pickupId,
        weight:    Number(form.weight),
        type:      form.type,
        quantity:  Number(form.quantity) || 1,
        codAmount: Number(form.codAmount) || 0,
      }
      if (form.length && form.width && form.height) {
        payload.dimensions = { length: Number(form.length), width: Number(form.width), height: Number(form.height) }
      }
      const res = await parcelsAPI.createFromPickup(payload)
      onCreated(res.data?.data?.parcel)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create parcel.')
    } finally { setCreating(false) }
  }

  return (
    <Modal title="Create Parcel from Pickup" onClose={onClose}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>{error}</div>
      )}

      {pickups.length === 0 ? (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: 20, textAlign: 'center', color: '#92400e', fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
          <strong>No eligible pickups found.</strong>
          <div style={{ marginTop: 6 }}>Create a pickup and assign an agent first.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Select Pickup *</label>
            <select style={inp} value={form.pickupId} onChange={setF('pickupId')} required>
              <option value="">— Choose a pickup —</option>
              {pickups.map(pu => (
                <option key={pu._id} value={pu._id}>
                  {pu.customer?.name} · {pu.pickupAddress?.city} · [{pu.status}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Weight (kg) *</label>
              <input style={inp} type="number" step="0.1" min="0.1" value={form.weight} onChange={setF('weight')} placeholder="e.g. 2.5" required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Parcel Type</label>
              <select style={inp} value={form.type} onChange={setF('type')}>
                {PARCEL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Dimensions (cm) — optional</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.length} onChange={setF('length')} placeholder="Length" />
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.width}  onChange={setF('width')}  placeholder="Width"  />
              <input style={{ ...inp, flex: 1 }} type="number" min="1" value={form.height} onChange={setF('height')} placeholder="Height" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Quantity</label>
              <input style={inp} type="number" min="1" value={form.quantity} onChange={setF('quantity')} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>COD Amount (₹)</label>
              <input style={inp} type="number" min="0" value={form.codAmount} onChange={setF('codAmount')} placeholder="0" />
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
            A UUID barcode + tracking ID will be auto-generated. Pickup will be marked as <strong>Picked</strong>.
          </div>

          <button type="submit" disabled={creating} style={{
            padding: 12, border: 'none', borderRadius: 10,
            background: creating ? '#a5b4fc' : '#4f46e5',
            color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>{creating ? 'Creating & generating barcode…' : 'Create Parcel'}</button>
        </form>
      )}
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ParcelsPage() {
  const [parcels, setParcels]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('All')
  const [search, setSearch]           = useState('')

  const [showCreate, setShowCreate]   = useState(false)
  const [detailParcel, setDetail]     = useState(null)   // parcel detail / barcode view
  const [statusModal, setStatusModal] = useState(null)
  const [newStatus, setNewStatus]     = useState('')
  const [location, setLocation]       = useState('')
  const [note, setNote]               = useState('')

  const fetchParcels = () => {
    setLoading(true)
    const params = filter !== 'All' ? { status: filter } : {}
    parcelsAPI.getAll(params)
      .then(r => setParcels(r.data?.data?.parcels ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchParcels() }, [filter])

  const handleCreated = () => { setShowCreate(false); fetchParcels() }

  const openDetail = async (id) => {
    try {
      const res = await parcelsAPI.getById(id)
      setDetail(res.data?.data?.parcel)
    } catch { alert('Failed to load parcel.') }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    try {
      await parcelsAPI.updateStatus(statusModal.id, { status: newStatus, location, note })
      setStatusModal(null); setNewStatus(''); setLocation(''); setNote('')
      fetchParcels()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status.')
    }
  }

  const filtered = parcels.filter(p =>
    p.trackingId?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Parcels</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{parcels.length} total parcels</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search tracking ID, barcode, customer…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width: 260 }}
          />
          <button onClick={() => setShowCreate(true)} style={{
            padding: '10px 18px', border: 'none', borderRadius: 10, cursor: 'pointer',
            background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14,
            fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>+ Create Parcel</button>
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            background: filter === s ? '#4f46e5' : '#fff',
            color: filter === s ? '#fff' : '#64748b',
            boxShadow: filter === s ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
          }}>{s}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading parcels…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {search ? 'No parcels match your search.' : 'No parcels yet.'}
            </div>
            {!search && (
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Click <strong>+ Create Parcel</strong> to create one from an assigned pickup.
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Tracking ID', 'Customer', 'Weight', 'Type', 'Barcode', 'Location', 'Created', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const badge = STATUS_COLORS[p.status] || { bg: '#f1f5f9', color: '#475569' }
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>{p.trackingId}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.customer?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.customer?.phone || ''}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{p.weight} kg</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', textTransform: 'capitalize' }}>{p.type}</td>
                      <td style={{ padding: '13px 16px' }}>
                        {/* Mini barcode preview */}
                        {p.barcode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', height: 20, gap: '1px', alignItems: 'stretch', width: 60 }}>
                              {p.barcode.replace(/-/g, '').slice(0, 16).split('').map((c, ci) => {
                                const n = parseInt(c, 16)
                                return <div key={ci} style={{ flex: n % 3 === 0 ? 2 : 1, background: n > 7 ? '#0f172a' : '#94a3b8', borderRadius: 1 }} />
                              })}
                            </div>
                            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}>{p.barcode.slice(0, 8)}…</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{p.currentLocation || '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmt(p.createdAt)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openDetail(p._id)} style={{
                            padding: '5px 10px', border: 'none', borderRadius: 7,
                            background: '#eef2ff', color: '#4f46e5', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                          }}>View</button>
                          <button onClick={() => { setStatusModal({ id: p._id }); setNewStatus(p.status); setLocation(p.currentLocation || '') }} style={{
                            padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 7,
                            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'inherit',
                          }}>Update</button>
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
      {showCreate  && <CreateParcelModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {detailParcel && <ParcelDetail parcel={detailParcel} onClose={() => setDetail(null)} />}

      {statusModal && (
        <Modal title="Update Parcel Status" onClose={() => { setStatusModal(null); setNewStatus(''); setLocation(''); setNote('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>New Status</label>
              <select style={inp} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {['Pending','In Pickup','At Center','In Transit','Delivered','Returned'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Location</label>
              <input style={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai Hub" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input style={inp} value={note} onChange={e => setNote(e.target.value)} placeholder="Any note…" />
            </div>
            <button onClick={handleStatusUpdate} style={{
              padding: 12, border: 'none', borderRadius: 10,
              background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>Update Status</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
