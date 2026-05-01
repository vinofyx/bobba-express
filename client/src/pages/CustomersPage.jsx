import { useState, useEffect } from 'react'
import { customersAPI } from '../api/customers.api'

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const EMPTY = {
  type: 'B2C', name: '', companyName: '', gst: '', phone: '', email: '',
  address: { line1: '', line2: '', city: '', state: '', pincode: '' },
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await customersAPI.getAll()
      setCustomers(res.data?.data?.customers || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({ type: c.type, name: c.name, companyName: c.companyName || '', gst: c.gst || '', phone: c.phone, email: c.email || '', address: c.address || EMPTY.address })
    setError(''); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY); setError('') }

  const setAddr = (k) => (e) => setForm(p => ({ ...p, address: { ...p.address, [k]: e.target.value } }))
  const set     = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address?.city) { setError('Name, phone and city are required.'); return }
    setSaving(true); setError('')
    try {
      if (editing) {
        await customersAPI.update(editing._id, form)
      } else {
        await customersAPI.create(form)
      }
      closeModal(); fetchCustomers()
    } catch (err) {
      // Show specific field errors from Joi validation (422) or fallback message
      const data = err?.response?.data
      if (data?.data?.errors?.length) {
        setError(data.data.errors.join(' • '))
      } else {
        setError(data?.message || 'Failed to save customer.')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this customer?')) return
    try {
      await customersAPI.delete(id)
      fetchCustomers()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete.')
    }
  }

  const filtered = customers.filter(c =>
    (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.companyName?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Customers</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{customers.length} registered customers</p>
        </div>
        <button onClick={openAdd} style={{ padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or company…"
          style={{ ...inp, flex: 1 }}
        />
        <div style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            {search ? 'No customers match your search.' : 'No customers yet — add one to get started.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Name', 'Type', 'Phone', 'Email', 'City', 'GST', 'Added', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c._id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 ? '#fafbfc' : '#fff' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                      {c.companyName && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.companyName}</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.type === 'B2B' ? '#ede9fe' : '#dbeafe', color: c.type === 'B2B' ? '#6d28d9' : '#1d4ed8' }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{c.phone}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{c.email || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{c.address?.city || '—'}, {c.address?.state || ''}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{c.gst || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8' }}>{fmt(c.createdAt)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(c)} style={{ padding: '5px 12px', border: 'none', borderRadius: 8, background: '#f1f5f9', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Edit</button>
                        <button onClick={() => handleDelete(c._id)} style={{ padding: '5px 12px', border: 'none', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Customer' : 'Add Customer'} onClose={closeModal}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Type */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['B2C', 'B2B'].map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                  style={{ flex: 1, padding: '9px 0', border: `2px solid ${form.type === t ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 8, background: form.type === t ? '#eef2ff' : '#fff', color: form.type === t ? '#4f46e5' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Full Name *</label>
                <input style={inp} value={form.name} onChange={set('name')} placeholder="John Doe" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Phone *</label>
                <input style={inp} value={form.phone} onChange={set('phone')} placeholder="9876543210" required />
              </div>
            </div>

            {form.type === 'B2B' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Company Name</label>
                  <input style={inp} value={form.companyName} onChange={set('companyName')} placeholder="Acme Pvt Ltd" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>GST Number</label>
                  <input style={inp} value={form.gst} onChange={set('gst')} placeholder="27ABCDE1234F1Z5" />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Email</label>
              <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Address</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inp} value={form.address.line1} onChange={setAddr('line1')} placeholder="Street / Area *" required />
                <input style={inp} value={form.address.line2} onChange={setAddr('line2')} placeholder="Landmark (optional)" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={{ ...inp, flex: 1 }} value={form.address.city} onChange={setAddr('city')} placeholder="City *" required />
                  <input style={{ ...inp, flex: 1 }} value={form.address.state} onChange={setAddr('state')} placeholder="State *" required />
                  <input style={{ ...inp, width: 100, flex: 'none' }} value={form.address.pincode} onChange={setAddr('pincode')} placeholder="PIN *" required />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ padding: '12px', border: 'none', borderRadius: 10, background: saving ? '#a5b4fc' : '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : editing ? 'Update Customer' : 'Add Customer'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
