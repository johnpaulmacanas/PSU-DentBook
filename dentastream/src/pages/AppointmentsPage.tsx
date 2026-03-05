import { useState } from 'react'
import './Page.css'

const ALL_APPOINTMENTS = [
  { id: 1,  patient: 'Maria Santos',    initials: 'MS', date: 'Mar 5',  time: '09:00 AM', type: 'Check-up',      chair: 'Chair 1', dentist: 'Dr. Reyes',  status: 'Confirmed' },
  { id: 2,  patient: 'Juan dela Cruz',  initials: 'JC', date: 'Mar 5',  time: '09:30 AM', type: 'Cleaning',      chair: 'Chair 2', dentist: 'Dr. Santos', status: 'Waiting'   },
  { id: 3,  patient: 'Ana Reyes',       initials: 'AR', date: 'Mar 5',  time: '10:15 AM', type: 'Filling',       chair: 'Chair 1', dentist: 'Dr. Reyes',  status: 'Confirmed' },
  { id: 4,  patient: 'Carlos Bautista', initials: 'CB', date: 'Mar 5',  time: '11:00 AM', type: 'Root Canal',    chair: 'Chair 3', dentist: 'Dr. Lim',    status: 'Confirmed' },
  { id: 5,  patient: 'Sofia Lim',       initials: 'SL', date: 'Mar 5',  time: '11:45 AM', type: 'Consultation', chair: 'Chair 2', dentist: 'Dr. Santos', status: 'Pending'   },
  { id: 6,  patient: 'Roberto Cruz',    initials: 'RC', date: 'Mar 5',  time: '01:00 PM', type: 'Extraction',    chair: 'Chair 3', dentist: 'Dr. Lim',    status: 'Confirmed' },
  { id: 7,  patient: 'Nena Torres',     initials: 'NT', date: 'Mar 5',  time: '02:30 PM', type: 'Whitening',     chair: 'Chair 1', dentist: 'Dr. Reyes',  status: 'Confirmed' },
  { id: 8,  patient: 'Pedro Villanueva', initials: 'PV', date: 'Mar 6', time: '09:00 AM', type: 'Check-up',      chair: 'Chair 2', dentist: 'Dr. Santos', status: 'Pending'   },
  { id: 9,  patient: 'Liza Gonzales',   initials: 'LG', date: 'Mar 6',  time: '10:00 AM', type: 'Braces',        chair: 'Chair 4', dentist: 'Dr. Reyes',  status: 'Confirmed' },
  { id: 10, patient: 'Marco Diaz',      initials: 'MD', date: 'Mar 7',  time: '09:30 AM', type: 'Cleaning',      chair: 'Chair 1', dentist: 'Dr. Reyes',  status: 'Pending'   },
]

const STATUS_CLASSES: Record<string, string> = {
  Confirmed: 'badge badge-green',
  Waiting:   'badge badge-amber',
  Pending:   'badge badge-gray',
  Completed: 'badge badge-blue',
  Cancelled: 'badge badge-red',
}

const TABS = ['All', 'Today', 'Upcoming', 'Pending']

export function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = ALL_APPOINTMENTS.filter(a => {
    const matchesSearch = a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'All' ||
      (activeTab === 'Today' && a.date === 'Mar 5') ||
      (activeTab === 'Upcoming' && a.date !== 'Mar 5') ||
      (activeTab === 'Pending' && a.status === 'Pending')
    return matchesSearch && matchesTab
  })

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage bookings, reschedules, and chair assignments.</p>
        </div>
        <button className="btn btn-primary">+ New Appointment</button>
      </div>

      {/* Summary chips */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {[
          { label: 'Total Today',  value: '18', color: 'green' },
          { label: 'Confirmed',    value: '12', color: 'blue'  },
          { label: 'Pending',      value: '4',  color: 'amber' },
          { label: 'Cancelled',    value: '2',  color: 'red'   },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '1rem 1.25rem' }}>
            <div className="stat-card-body">
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Tabs + search */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            className="header-search-input"
            style={{ marginLeft: 'auto', width: '220px' }}
            type="search"
            placeholder="Search patient or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Procedure</th>
                <th>Chair</th>
                <th>Dentist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="patient-avatar">{appt.initials}</span>
                      {appt.patient}
                    </div>
                  </td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td>{appt.type}</td>
                  <td>{appt.chair}</td>
                  <td>{appt.dentist}</td>
                  <td><span className={STATUS_CLASSES[appt.status]}>{appt.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-outline btn-sm">Edit</button>
                      <button className="btn btn-danger btn-sm">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
