import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

const STATUS_COLORS = {
  Requested: '#3b82f6', Assigned: '#8b5cf6', Picked: '#10b981', Failed: '#ef4444',
  Pending: '#94a3b8', 'In Pickup': '#f59e0b', 'At Center': '#06b6d4',
  'In Transit': '#6366f1', Delivered: '#22c55e', Returned: '#f43f5e',
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', flex: 1, borderLeft: `4px solid ${accent}`, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value ?? '—'}</div>
          {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.15 }}>{icon}</div>
      </div>
    </div>
  )
}

function BarChart({ title, data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(({ _id, count }) => (
          <div key={_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 90, fontSize: 12, color: '#475569', fontWeight: 500, textAlign: 'right', flexShrink: 0 }}>{_id}</div>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 22, overflow: 'hidden' }}>
              <div style={{ width: `${(count / max) * 100}%`, background: STATUS_COLORS[_id] || '#6366f1', height: '100%', borderRadius: 6, transition: 'width .4s', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{count}</span>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get('/dashboard/stats')
      .then(r => setData(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const STATUS_BADGE = {
    Requested: { bg: '#dbeafe', color: '#1d4ed8' },
    Assigned:  { bg: '#ede9fe', color: '#6d28d9' },
    Picked:    { bg: '#d1fae5', color: '#065f46' },
    Failed:    { bg: '#fee2e2', color: '#991b1b' },
  }

  const s = data?.stats

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Live overview of your logistics operations</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>Loading stats…</div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <StatCard label="Total Customers"    value={s?.totalCustomers}    sub="Registered"        accent="#4f46e5" icon="👥" />
            <StatCard label="Total Pickups"      value={s?.totalPickups}      sub="All time"          accent="#0ea5e9" icon="📦" />
            <StatCard label="Active Shipments"   value={s?.activeShipments}   sub="In transit"        accent="#f59e0b" icon="🚚" />
            <StatCard label="Delivered Parcels"  value={s?.deliveredParcels}  sub="Completed"         accent="#10b981" icon="✅" />
          </div>

          {/* ── Secondary Stats ── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <StatCard label="Pending Pickups"    value={s?.pendingPickups}    sub="Awaiting agent"    accent="#f43f5e" icon="⏳" />
            <StatCard label="Parcels At Center"  value={s?.atCenterParcels}   sub="Ready to ship"     accent="#06b6d4" icon="🏭" />
            <StatCard label="In Transit Parcels" value={s?.inTransitParcels}  sub="On the move"       accent="#6366f1" icon="🛣️" />
            <StatCard label="Picked Pickups"     value={s?.pickedPickups}     sub="Agent completed"   accent="#22c55e" icon="✔️" />
          </div>

          {/* ── Charts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <BarChart title="Pickups by Status" data={data?.charts?.pickupByStatus ?? []} />
            <BarChart title="Parcels by Status" data={data?.charts?.parcelByStatus ?? []} />
          </div>

          {/* ── Recent Pickups Table ── */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Recent Pickups</h2>
            </div>
            {!data?.recentPickups?.length ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No pickups yet — create one to get started</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Customer', 'City', 'Type', 'Agent', 'Scheduled', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPickups.map((p, i) => {
                      const b = STATUS_BADGE[p.status] || { bg: '#f1f5f9', color: '#475569' }
                      return (
                        <tr key={p._id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 ? '#fafbfc' : '#fff' }}>
                          <td style={{ padding: '13px 20px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.customer?.name || '—'}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.pickupAddress?.city || '—'}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569', textTransform: 'capitalize' }}>{p.deliveryType}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.assignedAgent?.name || <span style={{ color: '#cbd5e1' }}>Unassigned</span>}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{fmt(p.scheduledDate)}</td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: b.bg, color: b.color }}>{p.status}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
