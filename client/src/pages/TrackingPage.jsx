// Phase 8: Public tracking page — enter tracking ID → show timeline
// Staff/admin see an extra "Add Tracking Event" panel when logged in
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { trackingAPI } from '../api/tracking.api'
import axiosInstance from '../api/axiosInstance'

// ── Colours & icons per status ────────────────────────────────────────────────
const STATUS_DOT = {
  'Pending':    '#94a3b8',
  'In Pickup':  '#f59e0b',
  'At Center':  '#06b6d4',
  'In Transit': '#6366f1',
  'Delivered':  '#22c55e',
  'Returned':   '#f43f5e',
}
const STATUS_ICONS = {
  'Pending':    '⏳',
  'In Pickup':  '🚴',
  'At Center':  '🏭',
  'In Transit': '🚚',
  'Delivered':  '✅',
  'Returned':   '↩️',
}
const STEPS = ['Pending', 'In Pickup', 'At Center', 'In Transit', 'Delivered']

const fmt = d => d
  ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ── Progress stepper ──────────────────────────────────────────────────────────
function ProgressBar({ status }) {
  const stepIdx  = STEPS.indexOf(status)
  const returned = status === 'Returned'
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 18 }}>Delivery Progress</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STEPS.map((step, idx) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 'unset' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: returned && idx === stepIdx ? '#450a0a' : idx < stepIdx ? '#4f46e5' : idx === stepIdx ? '#312e81' : '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                border: idx === stepIdx ? `3px solid ${returned ? '#f43f5e' : '#818cf8'}` : '2px solid #334155',
              }}>
                {returned && idx === stepIdx ? '↩' : idx < stepIdx ? '✓' : <span style={{ color: idx === stepIdx ? '#a5b4fc' : '#475569', fontSize: 11, fontWeight: 700 }}>{idx + 1}</span>}
              </div>
              <div style={{ fontSize: 9, color: idx <= stepIdx ? (returned && idx === stepIdx ? '#f87171' : '#a5b4fc') : '#475569', marginTop: 5, textAlign: 'center', lineHeight: 1.3 }}>
                {returned && idx === stepIdx ? 'Returned' : step}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 3, background: idx < stepIdx ? '#4f46e5' : '#334155', marginBottom: 14, borderRadius: 2 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Single timeline event ─────────────────────────────────────────────────────
function TimelineEvent({ log, isFirst, isLast }) {
  const dot = STATUS_DOT[log.status] || '#6366f1'
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 13, height: 13, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 3, boxShadow: isFirst ? `0 0 0 4px ${dot}33` : 'none' }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: '#334155', margin: '4px 0' }} />}
      </div>
      <div style={{ paddingBottom: 22, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{log.status}</span>
          {isFirst && <span style={{ fontSize: 10, background: '#312e81', color: '#a5b4fc', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>LATEST</span>}
        </div>
        {log.location && (
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 3 }}>📍 {log.location}</div>
        )}
        {log.note && (
          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 3 }}>{log.note}</div>
        )}
        {log.gps?.lat && (
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#4f46e5', marginBottom: 3 }}>
            GPS {log.gps.lat.toFixed(5)}, {log.gps.lng.toFixed(5)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>{fmt(log.timestamp)}</span>
          {log.updatedBy?.name && (
            <span style={{ fontSize: 11, color: '#334155' }}>by {log.updatedBy.name} ({log.updatedBy.role})</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const user = useSelector(s => s.auth?.user)

  const [query, setQuery]     = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Staff manual update form
  const [addForm, setAddForm] = useState({ status: 'In Transit', location: '', note: '' })
  const [adding, setAdding]   = useState(false)
  const [addMsg, setAddMsg]   = useState({ type: '', text: '' })

  // Auto-search if ?id= in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) { setQuery(id); search(id) }
  }, [])

  const search = async (id) => {
    const tid = (id || query).trim().toUpperCase()
    if (!tid) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await trackingAPI.getByTrackingId(tid)
      setResult(res.data?.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Tracking ID not found. Please check and try again.')
    } finally { setLoading(false) }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!addForm.location) { setAddMsg({ type: 'err', text: 'Location is required.' }); return }
    setAdding(true); setAddMsg({ type: '', text: '' })
    try {
      await axiosInstance.post('/tracking', {
        parcelId: result.parcel._id,
        status:   addForm.status,
        location: addForm.location,
        note:     addForm.note || '',
      })
      setAddMsg({ type: 'ok', text: 'Tracking event added successfully.' })
      setAddForm({ status: 'In Transit', location: '', note: '' })
      await search(result.parcel.trackingId)   // refresh
    } catch (err) {
      setAddMsg({ type: 'err', text: err?.response?.data?.message || 'Failed to add event.' })
    } finally { setAdding(false) }
  }

  const parcel = result?.parcel
  const logs   = result?.logs ?? []
  const sc     = STATUS_DOT[parcel?.status] || '#94a3b8'

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 9, fontSize: 13,
    border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', fontFamily: 'system-ui,sans-serif', padding: '0 0 60px' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '52px 20px 40px' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📍</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -.5 }}>Track Your Parcel</h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: 15 }}>Enter your tracking ID to see real-time updates</p>
      </div>

      {/* ── Search bar ── */}
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 10, background: '#1e293b', borderRadius: 14, padding: '8px 8px 8px 18px', border: '1.5px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. TRKM4K2F8A9Z"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'monospace', background: 'transparent', color: '#f1f5f9', fontWeight: 700, letterSpacing: .5 }}
          />
          <button onClick={() => search()} disabled={loading} style={{
            padding: '10px 24px', border: 'none', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#312e81' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>{loading ? 'Searching…' : 'Track'}</button>
        </div>

        {error && (
          <div style={{ marginTop: 12, background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#fca5a5' }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {parcel && (
        <div style={{ maxWidth: 680, margin: '28px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Parcel summary */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: '24px 28px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tracking ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#60a5fa', letterSpacing: .5 }}>{parcel.trackingId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26 }}>{STATUS_ICONS[parcel.status] || '📦'}</div>
                <div style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc + '22', color: sc, marginTop: 4 }}>{parcel.status}</div>
              </div>
            </div>

            <ProgressBar status={parcel.status} />

            <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                ['Customer', parcel.customer?.name || '—'],
                ['Weight',   `${parcel.weight} kg`],
                ['Type',     parcel.type],
                ['Location', parcel.currentLocation || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: .5 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 3, textTransform: l === 'Type' ? 'capitalize' : 'none' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#1e293b', borderRadius: 16, padding: '24px 28px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Tracking Timeline</div>
              <span style={{ fontSize: 12, color: '#475569' }}>{logs.length} event{logs.length !== 1 ? 's' : ''}</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 13 }}>No tracking events yet.</div>
            ) : logs.map((log, i) => (
              <TimelineEvent key={log._id || i} log={log} isFirst={i === 0} isLast={i === logs.length - 1} />
            ))}
          </div>

          {/* ── Staff / Admin: Add Tracking Event ── */}
          {user && (user.role === 'admin' || user.role === 'staff') && (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: '24px 28px', border: '2px solid #312e81' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Add Tracking Event</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 18 }}>Manually push a tracking update to this parcel's timeline.</div>

              {addMsg.text && (
                <div style={{
                  background: addMsg.type === 'ok' ? '#052e16' : '#450a0a',
                  border: `1px solid ${addMsg.type === 'ok' ? '#166534' : '#7f1d1d'}`,
                  borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                  fontSize: 13, color: addMsg.type === 'ok' ? '#4ade80' : '#fca5a5',
                }}>{addMsg.text}</div>
              )}

              <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Status *</label>
                    <select style={inp} value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}>
                      {['Pending','In Pickup','At Center','In Transit','Delivered','Returned'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 2, minWidth: 180 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Location *</label>
                    <input style={inp} value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai Sorting Hub" required />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Note (optional)</label>
                  <input style={inp} value={addForm.note} onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))} placeholder="e.g. Package cleared security check" />
                </div>
                <button type="submit" disabled={adding} style={{
                  padding: 11, border: 'none', borderRadius: 9,
                  background: adding ? '#312e81' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>{adding ? 'Adding event…' : 'Add Tracking Event'}</button>
              </form>
            </div>
          )}

          {user && <div style={{ textAlign: 'center' }}><a href="/dashboard" style={{ color: '#334155', fontSize: 13, textDecoration: 'none' }}>← Back to Dashboard</a></div>}
        </div>
      )}

      {/* ── Empty state guide ── */}
      {!result && !loading && !error && (
        <div style={{ maxWidth: 580, margin: '40px auto 0', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              ['📋','Pickup Booked','Request submitted'],
              ['🚴','Agent Pickup','Agent collects parcel'],
              ['🏭','At Hub','Arrives at sorting center'],
              ['🚚','In Transit','Dispatched to destination'],
              ['✅','Delivered','Parcel handed over'],
              ['📍','GPS Tracked','Live coordinates at each step'],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
