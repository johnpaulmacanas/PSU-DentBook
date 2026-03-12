const overviewCards = [
  {
    label: 'Total Appointments',
    value: '128',
    change: '+12%',
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Active Patients',
    value: '94',
    change: '+5%',
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Today's Queue",
    value: '7',
    change: '-2',
    positive: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: 'Treatment Rooms',
    value: '4 / 6',
    change: 'Active now',
    positive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
]

const todayAppointments = [
  { time: '09:00', patient: 'Maria Santos', doctor: 'Dr. Reyes', procedure: 'Cleaning', status: 'Done' },
  { time: '10:00', patient: 'Juan dela Cruz', doctor: 'Dr. Lim', procedure: 'Extraction', status: 'In Chair' },
  { time: '11:00', patient: 'Ana Gomez', doctor: 'Dr. Reyes', procedure: 'Braces Check', status: 'Waiting' },
  { time: '13:00', patient: 'Ben Torres', doctor: 'Dr. Tan', procedure: 'Root Canal', status: 'Waiting' },
  { time: '14:30', patient: 'Carla Ramos', doctor: 'Dr. Lim', procedure: 'Whitening', status: 'Scheduled' },
]

const statusColors: Record<string, string> = {
  Done: 'bg-green-light/20 text-green',
  'In Chair': 'bg-primary/10 text-primary',
  Waiting: 'bg-yellow-100 text-yellow-700',
  Scheduled: 'bg-gray-2 text-dark-4',
}

const queueItems = [
  { name: 'Juan dela Cruz', room: 'Room 1', status: 'In Treatment', wait: '—' },
  { name: 'Ana Gomez', room: 'Waiting Area', status: 'Waiting', wait: '~10 min' },
  { name: 'Ben Torres', room: 'Waiting Area', status: 'Waiting', wait: '~25 min' },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-dark-5">Overview of today&apos;s clinical workflow and appointments.</p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-dark-5">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-dark">{card.value}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">{card.icon}</div>
            </div>
            <p className={['mt-3 text-xs font-medium', card.positive ? 'text-green' : 'text-red-500'].join(' ')}>
              {card.change} <span className="text-dark-5 font-normal">from last week</span>
            </p>
          </div>
        ))}
      </div>

      {/* Today's appointments + queue */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Appointments table */}
        <div className="col-span-2 rounded-xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Today&apos;s Appointments</h2>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {todayAppointments.length} visits
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden md:table-cell">Doctor</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {todayAppointments.map((appt) => (
                  <tr key={appt.time + appt.patient} className="hover:bg-gray-1 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-dark">{appt.time}</td>
                    <td className="px-5 py-3.5 text-dark">{appt.patient}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{appt.doctor}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{appt.procedure}</td>
                    <td className="px-5 py-3.5">
                      <span className={['rounded-full px-2.5 py-1 text-xs font-medium', statusColors[appt.status]].join(' ')}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time queue */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm">
          <div className="border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Real-Time Queue</h2>
            <p className="mt-0.5 text-xs text-dark-5">Who is currently in the clinic</p>
          </div>
          <ul className="divide-y divide-stroke px-5">
            {queueItems.map((item) => (
              <li key={item.name} className="flex items-center gap-3 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-dark">{item.name}</p>
                  <p className="text-xs text-dark-5">{item.room}</p>
                </div>
                <span className={['shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', statusColors[item.status] ?? 'bg-gray-2 text-dark-4'].join(' ')}>
                  {item.status === 'Waiting' ? item.wait : item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
