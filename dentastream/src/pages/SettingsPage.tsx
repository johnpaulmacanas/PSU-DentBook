import { useState } from 'react'
import './Page.css'

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <label className="toggle">
      <input type="checkbox" checked={on} onChange={() => setOn(o => !o)} />
      <span className="toggle-slider" />
    </label>
  )
}

export function SettingsPage() {
  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure clinic hours, roles, and notification rules.</p>
        </div>
        <button className="btn btn-primary">Save Changes</button>
      </div>

      <div className="grid-2">
        {/* Clinic Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Clinic Configuration</h2>
          </div>
          <div className="form-grid" style={{ marginTop: 0 }}>
            <label>
              <span>Clinic Name</span>
              <input type="text" defaultValue="PSU DentBook Dental Clinic" />
            </label>
            <label>
              <span>Clinic Hours (Start)</span>
              <input type="time" defaultValue="08:00" />
            </label>
            <label>
              <span>Clinic Hours (End)</span>
              <input type="time" defaultValue="17:00" />
            </label>
            <label>
              <span>Appointment Slot Duration</span>
              <select className="form-select" defaultValue="30">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
            <label>
              <span>Max Daily Appointments per Chair</span>
              <input type="number" defaultValue={12} min={1} max={30} />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Notifications</h2>
          </div>
          <div className="settings-section">
            {[
              { label: 'Email Reminders',          desc: 'Send appointment reminders by email',      on: true  },
              { label: 'SMS Reminders',             desc: 'Send reminders via SMS 24 hrs before',     on: true  },
              { label: 'New Booking Alerts',        desc: 'Notify staff when new bookings arrive',    on: true  },
              { label: 'Cancellation Alerts',       desc: 'Notify dentist when a booking is cancelled', on: false },
              { label: 'Daily Summary Email',       desc: 'Send daily schedule to all dentists',      on: false },
            ].map(row => (
              <div key={row.label} className="settings-row">
                <div>
                  <div className="settings-row-label">{row.label}</div>
                  <div className="settings-row-desc">{row.desc}</div>
                </div>
                <Toggle defaultChecked={row.on} />
              </div>
            ))}
          </div>
        </div>

        {/* Booking Rules */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Booking Rules</h2>
          </div>
          <div className="settings-section">
            {[
              { label: 'Allow Online Booking',     desc: 'Patients can book via the patient portal', on: true  },
              { label: 'Require Deposit',          desc: 'Require payment deposit on booking',        on: false },
              { label: 'Auto-confirm Bookings',    desc: 'Confirm bookings without staff review',     on: false },
              { label: 'Block Double Booking',     desc: 'Prevent overlapping chair assignments',     on: true  },
            ].map(row => (
              <div key={row.label} className="settings-row">
                <div>
                  <div className="settings-row-label">{row.label}</div>
                  <div className="settings-row-desc">{row.desc}</div>
                </div>
                <Toggle defaultChecked={row.on} />
              </div>
            ))}
          </div>
        </div>

        {/* Staff Roles - full width */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title">Staff & Roles</h2>
            <button className="card-action">+ Add Staff</button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {[
                  { name: 'Dr. Reyes',  initials: 'DR', role: 'Dentist / Admin', active: true  },
                  { name: 'Dr. Santos', initials: 'DS', role: 'Dentist',          active: true  },
                  { name: 'Dr. Lim',    initials: 'DL', role: 'Orthodontist',     active: true  },
                  { name: 'Ana Cruz',   initials: 'AC', role: 'Front Desk',       active: true  },
                  { name: 'Ben Torres', initials: 'BT', role: 'Assistant',        active: false },
                ].map(s => (
                  <tr key={s.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="patient-avatar">{s.initials}</span>
                        {s.name}
                      </div>
                    </td>
                    <td>{s.role}</td>
                    <td>
                      <span className={s.active ? 'badge badge-green' : 'badge badge-gray'}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><button className="btn btn-outline btn-sm">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
