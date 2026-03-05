import { useState } from 'react'
import './Page.css'

const PATIENTS = [
  { id: 1,  name: 'Maria Santos',     initials: 'MS', age: 32, gender: 'F', phone: '09171234567', lastVisit: 'Mar 5, 2026',  status: 'Active',   treatments: ['Cleaning', 'Whitening'] },
  { id: 2,  name: 'Juan dela Cruz',   initials: 'JC', age: 45, gender: 'M', phone: '09182345678', lastVisit: 'Feb 22, 2026', status: 'Active',   treatments: ['Root Canal', 'Filling'] },
  { id: 3,  name: 'Ana Reyes',        initials: 'AR', age: 27, gender: 'F', phone: '09193456789', lastVisit: 'Mar 5, 2026',  status: 'Active',   treatments: ['Braces'] },
  { id: 4,  name: 'Carlos Bautista',  initials: 'CB', age: 55, gender: 'M', phone: '09204567890', lastVisit: 'Jan 14, 2026', status: 'Inactive', treatments: ['Extraction'] },
  { id: 5,  name: 'Sofia Lim',        initials: 'SL', age: 19, gender: 'F', phone: '09215678901', lastVisit: 'Mar 3, 2026',  status: 'Active',   treatments: ['Check-up'] },
  { id: 6,  name: 'Roberto Cruz',     initials: 'RC', age: 60, gender: 'M', phone: '09226789012', lastVisit: 'Feb 10, 2026', status: 'Active',   treatments: ['Dentures', 'Extraction'] },
  { id: 7,  name: 'Nena Torres',      initials: 'NT', age: 38, gender: 'F', phone: '09237890123', lastVisit: 'Mar 1, 2026',  status: 'Active',   treatments: ['Whitening'] },
  { id: 8,  name: 'Pedro Villanueva', initials: 'PV', age: 42, gender: 'M', phone: '09248901234', lastVisit: 'Dec 20, 2025', status: 'Inactive', treatments: ['Filling'] },
]

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [filterStatus, setFilterStatus] = useState('All')

  const filtered = PATIENTS.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.phone.includes(q)
    const matchStatus = filterStatus === 'All' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const selected = PATIENTS.find(p => p.id === selectedId) ?? null

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Search and manage patient records and visit history.</p>
        </div>
        <button className="btn btn-primary">+ Add Patient</button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>
        {/* Patient list */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Patient List</h2>
            <span className="text-muted">{filtered.length} records</span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              className="header-search-input"
              style={{ flex: 1, minWidth: '160px' }}
              type="search"
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {['All', 'Active', 'Inactive'].map(s => (
              <button
                key={s}
                className={filterStatus === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer', background: selectedId === p.id ? '#f0fdf4' : undefined }}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="patient-avatar">{p.initials}</span>
                        {p.name}
                      </div>
                    </td>
                    <td>{p.age}</td>
                    <td>{p.phone}</td>
                    <td>{p.lastVisit}</td>
                    <td>
                      <span className={p.status === 'Active' ? 'badge badge-green' : 'badge badge-gray'}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient detail */}
        <div className="card">
          {selected ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0 1.25rem' }}>
                <div className="patient-avatar" style={{ width: 56, height: 56, fontSize: '1rem' }}>
                  {selected.initials}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{selected.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={selected.status === 'Active' ? 'badge badge-green' : 'badge badge-gray'}>
                    {selected.status}
                  </span>
                </div>
              </div>

              <hr className="divider" />

              <div className="settings-section">
                {[
                  { label: 'Age',        value: `${selected.age} yrs` },
                  { label: 'Gender',     value: selected.gender === 'F' ? 'Female' : 'Male' },
                  { label: 'Phone',      value: selected.phone },
                  { label: 'Last Visit', value: selected.lastVisit },
                ].map(row => (
                  <div key={row.label} className="settings-row">
                    <span className="settings-row-desc">{row.label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <hr className="divider" style={{ marginTop: '0.5rem' }} />

              <div style={{ marginTop: '0.75rem' }}>
                <div className="card-title" style={{ marginBottom: '0.6rem' }}>Treatment History</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selected.treatments.map(t => (
                    <span key={t} className="badge badge-blue">{t}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>Book Appointment</button>
                <button className="btn btn-outline btn-sm">Edit</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
              Select a patient to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
