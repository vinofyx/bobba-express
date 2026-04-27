import { useEffect, useState } from 'react'
import { pickupAPI } from '../api/pickupApi'
import { customersAPI } from '../api/customers.api'
import { usersAPI } from '../api/users.api'

const STATUSES = ['All', 'Requested', 'Assigned', 'Picked', 'Failed']

const STATUS_COLORS = {
  Requested: { bg: '#dbeafe', color: '#1d4ed8' },
  Assigned:  { bg: '#ede9fe', color: '#6d28d9' },
  Picked:    { bg: '#d1fae5', color: '#065f46' },
  Failed:    { bg: '#fee2e2', color: '#991b1b' },
}

const EMPTY_FORM = {
  customerId: '', line1: '', line2: '', city: '', state: '', pincode: '',
  deliveryType: 'standard', parcelType: 'parcel',
  scheduledDate: '', pickupTime: '09:00', notes: '',
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PickupsPage() {
  const [pickups, setPickups]         = useState([])
  const [customers, setCustomers]     = useState([])
  const [agents, setAgents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('All')

  // create form
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState('')

  // status update modal
  const [statusModal, setStatusModal] = useState(null) // { id, current }
  const [newStatus, setNewStatus]     = useState('')
  const [statusNote, setStatusNote]   = useState('')

  // assign agent modal
  const [assignModal, setAssignModal] = useState(null) // { id, current }
  const [selectedAgent, setSelectedAgent] = useState('')
  const [assigning, setAssigning]     = useState(false)

  const fetchPickups = () => {
    setLoading(true)
    pickupAPI.getAll()
      .then(r => setPickups(r.data?.data?.pickups ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPickups()
    customersAPI.getAll().then(r => setCustomers(r.data?.data?.customers ?? []))
    usersAPI.getAgents().then(r => setAgents(r.data?.data?.users ?? []))
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  // ── Create pickup ──────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(''); setSaving(true)
    try {
      await pickupAPI.create({
        customer: form.customerId,
        pickupAddress: {
          line1: form.line1, line2: form.line2 || undefined,
          city: form.city, state: form.state, pincode: form.pincode,
        },
        deliveryType: form.deliveryType,
        parcelType:   form.parcelType,
        scheduledDate: form.scheduledDate,
        pickupTime:    form.pickupTime,
        notes: form.notes || undefined,
      })
      setShowForm(false); setForm(EMPTY_FORM); fetchPickups()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create pickup.')
    } finally { setSaving(false) }
  }

  // ── Assign agent ───────────────────────────────────────────────────────────
  const openAssign = (pickup) => {
    setAssignModal({ id: pickup._id, currentAgent: pickup.assignedAgent?.name || null })
    setSelectedAgent(pickup.assignedAgent?._id || '')
  }

  const handleAssign = async () => {
    if (!selectedAgent) return
    setAssigning(true)
    try {
      await pickupAPI.assignAgent(assignModal.id, selectedAgent)
      setAssignModal(null); setSelectedAgent(''); fetchPickups()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to assign agent.')
    } finally { setAssigning(false) }
  }

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!newStatus) return
    try {
      await pickupAPI.updateStatus(statusModal.id, { status: newStatus, note: statusNote })
      setStatusModal(null); setNewStatus(''); setStatusNote(''); fetchPickups()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status.')
    }
  }

  const filtered = filter === 'All' ? pickups : pickups.filter(p => p.status === filter)
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Pickups</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{pickups.length} total pickup requests</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError('') }} style={{
          padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
          background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
        }}>+ New Pickup</button>
      </div>

      {/* ── Status filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            background: filter === s ? '#4f46e5' : '#fff',
            color: filter === s ? '#fff' : '#64748b',
            boxShadow: filter === s ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
          }}>{s}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading pickups…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            {filter === 'All' ? 'No pickups yet — create one to get started.' : `No ${filter} pickups.`}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Customer', 'Pickup Address', 'Type', 'Scheduled', 'Agent', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const badge = STATUS_COLORS[p.status] || { bg: '#f1f5f9', color: '#475569' }
                  const canAssign = p.status === 'Requested' || p.status === 'Assigned'
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.customer?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.customer?.phone || ''}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                        <div>{p.pickupAddress?.line1}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.pickupAddress?.city}, {p.pickupAddress?.state} – {p.pickupAddress?.pincode}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                        <div style={{ textTransform: 'capitalize' }}>{p.deliveryType?.replace('_', ' ')}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{p.parcelType}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                        <div>{fmt(p.scheduledDate)}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.pickupTime}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13 }}>
                        {p.assignedAgent?.name
                          ? <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.assignedAgent.name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.assignedAgent.phone || ''}</div>
                            </div>
                          : <span style={{ color: '#cbd5e1', fontSize: 12 }}>Unassigned</span>
                        }
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {canAssign && (
                            <button onClick={() => openAssign(p)} style={{
                              padding: '5px 10px', border: 'none', borderRadius: 7,
                              background: '#eef2ff', color: '#4f46e5', cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
                            }}>
                              {p.assignedAgent ? 'Reassign' : 'Assign'}
                            </button>
                          )}
                          <button onClick={() => { setStatusModal({ id: p._id, current: p.status }); setNewStatus(p.status) }} style={{
                            padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 7,
                            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'inherit',
                          }}>
                            Status
                          </button>
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

      {/* ── Create Pickup Modal ── */}
      {showForm && (
        <Modal title="New Pickup Request" onClose={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM) }}>
          {formError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>{formError}</div>
          )}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Customer */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Customer *</label>
              <select style={inp} value={form.customerId} onChange={set('customerId')} required>
                <option value="">— Select customer —</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Pickup Address */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>Pickup Address</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inp} value={form.line1} onChange={set('line1')} required placeholder="Street / Area *" />
                <input style={inp} value={form.line2} onChange={set('line2')} placeholder="Landmark (optional)" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={{ ...inp, flex: 1 }} value={form.city}    onChange={set('city')}    required placeholder="City *" />
                  <input style={{ ...inp, flex: 1 }} value={form.state}   onChange={set('state')}   required placeholder="State *" />
                  <input style={{ ...inp, width: 90, flex: 'none' }} value={form.pincode} onChange={set('pincode')} required placeholder="PIN *" />
                </div>
              </div>
            </div>

            {/* Delivery & Parcel type */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Delivery Type</label>
                <select style={inp} value={form.deliveryType} onChange={set('deliveryType')}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="same_day">Same Day</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Parcel Type</label>
                <select style={inp} value={form.parcelType} onChange={set('parcelType')}>
                  <option value="document">Document</option>
                  <option value="parcel">Parcel</option>
                  <option value="fragile">Fragile</option>
                  <option value="electronics">Electronics</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Scheduled Date *</label>
                <input style={inp} type="date" value={form.scheduledDate} onChange={set('scheduledDate')} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Pickup Time</label>
                <input style={inp} type="time" value={form.pickupTime} onChange={set('pickupTime')} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
              <textarea style={{ ...inp, resize: 'vertical' }} value={form.notes} onChange={set('notes')} rows={2} placeholder="Special instructions…" />
            </div>

            <button type="submit" disabled={saving} style={{
              marginTop: 4, padding: 12, border: 'none', borderRadius: 10,
              background: saving ? '#a5b4fc' : '#4f46e5', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>{saving ? 'Creating…' : 'Create Pickup'}</button>
          </form>
        </Modal>
      )}

      {/* ── Assign Agent Modal ── */}
      {assignModal && (
        <Modal title="Assign Field Agent" onClose={() => { setAssignModal(null); setSelectedAgent('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignModal.currentAgent && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                Currently assigned: <strong>{assignModal.currentAgent}</strong>
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                Select Agent *
              </label>
              {agents.length === 0 ? (
                <div style={{ padding: '12px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                  No agents available. Create a user with role "agent" first.
                </div>
              ) : (
                <select style={inp} value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} required>
                  <option value="">— Select an agent —</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              )}
            </div>

            {agents.length > 0 && (
              <button
                onClick={handleAssign}
                disabled={!selectedAgent || assigning}
                style={{
                  padding: 12, border: 'none', borderRadius: 10,
                  background: !selectedAgent || assigning ? '#a5b4fc' : '#4f46e5',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: !selectedAgent || assigning ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {assigning ? 'Assigning…' : 'Assign Agent'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ── Status Update Modal ── */}
      {statusModal && (
        <Modal title="Update Pickup Status" onClose={() => { setStatusModal(null); setNewStatus(''); setStatusNote('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#475569' }}>
              Current status: <strong style={{ color: '#0f172a' }}>{statusModal.current}</strong>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>New Status *</label>
              <select style={inp} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="Requested">Requested</option>
                <option value="Assigned">Assigned</option>
                <option value="Picked">Picked</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input style={inp} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Reason or update note…" />
            </div>
            <button onClick={handleStatusUpdate} style={{
              padding: 12, border: 'none', borderRadius: 10,
              background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Update Status</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
