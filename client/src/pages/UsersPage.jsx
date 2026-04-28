import { useEffect, useState } from 'react'
import { usersAPI } from '../api/users.api'

const ROLE_STYLE = {
  admin: { background: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' },
  staff: { background: '#0c4a6e', color: '#38bdf8', border: '1px solid #0369a1' },
  agent: { background: '#14532d', color: '#4ade80', border: '1px solid #15803d' },
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff', phone: '' }

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser,   setEditUser]   = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [formError,  setFormError]  = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await usersAPI.getAll()
      setUsers(res.data?.data?.users || [])
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visible = filter === 'all' ? users : users.filter(u => u.role === filter)

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setCreateOpen(true) }
  const openEdit   = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' }); setFormError(''); setEditUser(u) }
  const closeAll   = () => { setCreateOpen(false); setEditUser(null) }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      setFormError('Name, email, password and role are required.')
      return
    }
    try {
      setSaving(true); setFormError('')
      await usersAPI.create(form)
      closeAll(); load()
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to create user.')
    } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!form.name || !form.role) { setFormError('Name and role are required.'); return }
    try {
      setSaving(true); setFormError('')
      await usersAPI.update(editUser._id, { name: form.name, role: form.role, phone: form.phone })
      closeAll(); load()
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to update user.')
    } finally { setSaving(false) }
  }

  const handleToggle = async (u) => {
    if (!window.confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)) return
    try {
      await usersAPI.toggle(u._id)
      load()
    } catch { alert('Failed to toggle user status.') }
  }

  const counts = {
    all:   users.length,
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    agent: users.filter(u => u.role === 'agent').length,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>User Management</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Admin-only — create and manage platform accounts</p>
        </div>
        <button onClick={openCreate} style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + Add User
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {['all','admin','staff','agent'].map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            padding: '6px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filter === r ? '#4f46e5' : '#f1f5f9',
            color:      filter === r ? '#fff'    : '#64748b',
          }}>
            {r.charAt(0).toUpperCase() + r.slice(1)} ({counts[r]})
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading users…</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No users found.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Name','Email','Role','Phone','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((u, i) => (
                <tr key={u._id} style={{ borderBottom: i < visible.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: u.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', ...ROLE_STYLE[u.role] }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: 13 }}>{u.phone || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#16a34a' : '#dc2626' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '5px 12px', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        Edit
                      </button>
                      <button onClick={() => handleToggle(u)} style={{ padding: '5px 12px', background: u.isActive ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: u.isActive ? '#dc2626' : '#16a34a' }}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(createOpen || editUser) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 460, maxWidth: '95vw' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              {createOpen ? 'Add New User' : `Edit — ${editUser?.name}`}
            </h2>

            {formError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{formError}</div>
            )}

            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Full Name *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" style={INPUT} />
              </Field>

              {createOpen && (
                <Field label="Email *">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="rahul@example.com" style={INPUT} />
                </Field>
              )}

              {createOpen && (
                <Field label="Password *">
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" style={INPUT} />
                </Field>
              )}

              <Field label="Role *">
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={INPUT}>
                  <option value="admin">Admin — full access</option>
                  <option value="staff">Staff — operations only</option>
                  <option value="agent">Agent — field operations</option>
                </select>
              </Field>

              <Field label="Phone">
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile number" style={INPUT} />
              </Field>
            </div>

            {/* Role description box */}
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', borderLeft: '3px solid #4f46e5' }}>
              {form.role === 'admin' && 'Admin has full access: manage users, view all data, configure settings.'}
              {form.role === 'staff' && 'Staff handles operations: pickups, parcels, shipments, customers. Cannot manage users.'}
              {form.role === 'agent' && 'Agent is field-only: view assigned pickups, update statuses, enter parcel details via mobile panel.'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeAll} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                Cancel
              </button>
              <button onClick={createOpen ? handleCreate : handleEdit} disabled={saving} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? .7 : 1 }}>
                {saving ? 'Saving…' : createOpen ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</label>
      {children}
    </div>
  )
}

const INPUT = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1e293b' }
