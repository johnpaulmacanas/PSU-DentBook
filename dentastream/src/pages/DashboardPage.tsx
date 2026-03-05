import './Page.css'

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const upcomingAppointments = [
  { id: 1, patient: 'Maria Santos',    initials: 'MS', time: '09:00 AM', type: 'Check-up',       chair: 'Chair 1', status: 'Confirmed' },
  { id: 2, patient: 'Juan dela Cruz',  initials: 'JC', time: '09:30 AM', type: 'Cleaning',       chair: 'Chair 2', status: 'Waiting'   },
  { id: 3, patient: 'Ana Reyes',       initials: 'AR', time: '10:15 AM', type: 'Filling',        chair: 'Chair 1', status: 'Confirmed' },
  { id: 4, patient: 'Carlos Bautista', initials: 'CB', time: '11:00 AM', type: 'Root Canal',     chair: 'Chair 3', status: 'Confirmed' },
  { id: 5, patient: 'Sofia Lim',       initials: 'SL', time: '11:45 AM', type: 'Consultation',  chair: 'Chair 2', status: 'Pending'   },
]

const statusBadge: Record<string, string> = {
  Confirmed: 'badge badge-green',
  Waiting:   'badge badge-amber',
  Pending:   'badge badge-gray',
  Completed: 'badge badge-blue',
}

export function DashboardPage() {
  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Thursday, March 5 – Good morning, Dr. Reyes 👋</p>
        </div>
        <button className="btn btn-primary">+ New Appointment</button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><IconCalendar /></div>
          <div className="stat-card-body">
            <div className="stat-card-label">Today's Appointments</div>
            <div className="stat-card-value">18</div>
            <div className="stat-card-change">↑ 3 more than yesterday</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><IconUsers /></div>
          <div className="stat-card-body">
            <div className="stat-card-label">Total Patients</div>
            <div className="stat-card-value">1,240</div>
            <div className="stat-card-change">↑ 12 new this week</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber"><IconClock /></div>
          <div className="stat-card-body">
            <div className="stat-card-label">In Waiting Room</div>
            <div className="stat-card-value">4</div>
            <div className="stat-card-change">Avg wait: 8 min</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><IconCheck /></div>
          <div className="stat-card-body">
            <div className="stat-card-label">Completed Today</div>
            <div className="stat-card-value">7</div>
            <div className="stat-card-change">↑ 2 ahead of schedule</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Upcoming appointments */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title">Today's Schedule</h2>
            <a href="/appointments" className="card-action">View all →</a>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Procedure</th>
                  <th>Chair</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="patient-avatar">{appt.initials}</span>
                        {appt.patient}
                      </div>
                    </td>
                    <td>{appt.time}</td>
                    <td>{appt.type}</td>
                    <td>{appt.chair}</td>
                    <td><span className={statusBadge[appt.status]}>{appt.status}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Queue + Chairs */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Real-Time Queue</h2>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="settings-section">
            {[
              { name: 'Juan dela Cruz', status: 'Waiting',    time: '8 min' },
              { name: 'Ana Reyes',      status: 'In Chair 1', time: '15 min' },
              { name: 'Sofia Lim',      status: 'Waiting',    time: '3 min' },
            ].map(p => (
              <div key={p.name} className="settings-row">
                <div>
                  <div className="settings-row-label">{p.name}</div>
                  <div className="settings-row-desc">{p.status}</div>
                </div>
                <span className="text-muted">{p.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Chair Utilization</h2>
          </div>
          <div className="settings-section">
            {[
              { chair: 'Chair 1', dentist: 'Dr. Reyes',   status: 'Occupied',   color: 'badge-red'   },
              { chair: 'Chair 2', dentist: 'Dr. Santos',  status: 'Occupied',   color: 'badge-amber' },
              { chair: 'Chair 3', dentist: '—',           status: 'Available',  color: 'badge-green' },
              { chair: 'Chair 4', dentist: 'Dr. Lim',     status: 'Break',      color: 'badge-gray'  },
            ].map(c => (
              <div key={c.chair} className="settings-row">
                <div>
                  <div className="settings-row-label">{c.chair}</div>
                  <div className="settings-row-desc">{c.dentist}</div>
                </div>
                <span className={`badge ${c.color}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
