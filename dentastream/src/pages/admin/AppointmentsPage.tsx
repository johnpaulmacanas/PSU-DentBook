import { useState } from 'react'

type Status = 'All' | 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled'

const ALL_APPOINTMENTS = [
  { id: 1, date: 'Mar 12', time: '09:00', patient: 'Maria Santos', doctor: 'Dr. Reyes', procedure: 'Cleaning', status: 'Completed' },
  { id: 2, date: 'Mar 12', time: '10:00', patient: 'Juan dela Cruz', doctor: 'Dr. Lim', procedure: 'Extraction', status: 'Confirmed' },
  { id: 3, date: 'Mar 12', time: '11:00', patient: 'Ana Gomez', doctor: 'Dr. Reyes', procedure: 'Braces Check', status: 'Scheduled' },
  { id: 4, date: 'Mar 13', time: '09:30', patient: 'Ben Torres', doctor: 'Dr. Tan', procedure: 'Root Canal', status: 'Scheduled' },
  { id: 5, date: 'Mar 13', time: '14:00', patient: 'Carla Ramos', doctor: 'Dr. Lim', procedure: 'Whitening', status: 'Confirmed' },
  { id: 6, date: 'Mar 14', time: '10:30', patient: 'Diego Bautista', doctor: 'Dr. Reyes', procedure: 'Filling', status: 'Scheduled' },
  { id: 7, date: 'Mar 10', time: '08:00', patient: 'Elena Cruz', doctor: 'Dr. Tan', procedure: 'X-Ray', status: 'Cancelled' },
]

const STATUS_TABS: Status[] = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled']

const statusColors: Record<string, string> = {
  Completed: 'bg-green-light/20 text-green',
  Confirmed: 'bg-primary/10 text-primary',
  Scheduled: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-50 text-red-500',
}

export function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<Status>('All')

  const filtered = activeTab === 'All'
    ? ALL_APPOINTMENTS
    : ALL_APPOINTMENTS.filter(a => a.status === activeTab)

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Appointments</h1>
          <p className="mt-1 text-sm text-dark-5">Manage bookings, reschedules, and chair assignments.</p>
        </div>
        <button className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          + New Appointment
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: ALL_APPOINTMENTS.length, color: 'text-dark' },
          { label: 'Scheduled', value: ALL_APPOINTMENTS.filter(a => a.status === 'Scheduled').length, color: 'text-yellow-600' },
          { label: 'Confirmed', value: ALL_APPOINTMENTS.filter(a => a.status === 'Confirmed').length, color: 'text-primary' },
          { label: 'Completed', value: ALL_APPOINTMENTS.filter(a => a.status === 'Completed').length, color: 'text-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-dark-5">{label}</p>
            <p className={['mt-1 text-2xl font-bold', color].join(' ')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-stroke px-5 pt-4 pb-0">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-dark-5 hover:text-dark',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3 hidden md:table-cell">Doctor</th>
                <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {filtered.map(appt => (
                <tr key={appt.id} className="hover:bg-gray-1 transition-colors">
                  <td className="px-5 py-3.5 text-dark-5">{appt.date}</td>
                  <td className="px-5 py-3.5 font-medium text-dark">{appt.time}</td>
                  <td className="px-5 py-3.5 font-medium text-dark">{appt.patient}</td>
                  <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{appt.doctor}</td>
                  <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{appt.procedure}</td>
                  <td className="px-5 py-3.5">
                    <span className={['rounded-full px-2.5 py-1 text-xs font-medium', statusColors[appt.status]].join(' ')}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-xs font-medium text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-dark-5">No appointments found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
