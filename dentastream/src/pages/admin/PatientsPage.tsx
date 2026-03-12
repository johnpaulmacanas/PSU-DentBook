import { useState } from 'react'

const PATIENTS = [
  { id: 'P-001', name: 'Maria Santos', age: 34, gender: 'F', contact: '09171234567', lastVisit: 'Mar 12, 2026', doctor: 'Dr. Reyes', status: 'Active' },
  { id: 'P-002', name: 'Juan dela Cruz', age: 27, gender: 'M', contact: '09281234567', lastVisit: 'Mar 12, 2026', doctor: 'Dr. Lim', status: 'Active' },
  { id: 'P-003', name: 'Ana Gomez', age: 19, gender: 'F', contact: '09351234567', lastVisit: 'Feb 28, 2026', doctor: 'Dr. Reyes', status: 'Active' },
  { id: 'P-004', name: 'Ben Torres', age: 45, gender: 'M', contact: '09161234567', lastVisit: 'Mar 10, 2026', doctor: 'Dr. Tan', status: 'Active' },
  { id: 'P-005', name: 'Carla Ramos', age: 29, gender: 'F', contact: '09491234567', lastVisit: 'Jan 15, 2026', doctor: 'Dr. Lim', status: 'Inactive' },
  { id: 'P-006', name: 'Diego Bautista', age: 52, gender: 'M', contact: '09221234567', lastVisit: 'Mar 14, 2026', doctor: 'Dr. Reyes', status: 'Active' },
  { id: 'P-007', name: 'Elena Cruz', age: 38, gender: 'F', contact: '09111234567', lastVisit: 'Mar 10, 2026', doctor: 'Dr. Tan', status: 'Inactive' },
]

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof PATIENTS[0] | null>(null)

  const filtered = PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Patients</h1>
          <p className="mt-1 text-sm text-dark-5">Search and manage patient records and visit history.</p>
        </div>
        <button className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          + Add Patient
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Patient list */}
        <div className="xl:col-span-2 rounded-xl border border-stroke bg-white shadow-sm">
          {/* Search */}
          <div className="border-b border-stroke p-4">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or patient ID..."
                className="w-full rounded-lg border border-stroke bg-gray-1 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden sm:table-cell">ID</th>
                  <th className="px-5 py-3 hidden md:table-cell">Last Visit</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Doctor</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={[
                      'cursor-pointer transition-colors hover:bg-gray-1',
                      selected?.id === p.id ? 'bg-primary/5' : '',
                    ].join(' ')}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-dark">{p.name}</p>
                          <p className="text-xs text-dark-5">{p.age}y · {p.gender === 'M' ? 'Male' : 'Female'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-dark-5 hidden sm:table-cell">{p.id}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{p.lastVisit}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{p.doctor}</td>
                    <td className="px-5 py-3.5">
                      <span className={[
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        p.status === 'Active' ? 'bg-green-light/20 text-green' : 'bg-gray-2 text-dark-5',
                      ].join(' ')}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-dark-5">No patients found.</p>
            )}
          </div>
        </div>

        {/* Patient detail */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm">
          {selected ? (
            <div className="p-5">
              <div className="flex items-center gap-4 pb-5 border-b border-stroke">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {selected.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-dark">{selected.name}</h3>
                  <p className="text-sm text-dark-5">{selected.id}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { label: 'Age', value: `${selected.age} years old` },
                  { label: 'Gender', value: selected.gender === 'F' ? 'Female' : 'Male' },
                  { label: 'Contact', value: selected.contact },
                  { label: 'Doctor', value: selected.doctor },
                  { label: 'Last Visit', value: selected.lastVisit },
                  { label: 'Status', value: selected.status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-dark-5">{label}</dt>
                    <dd className="font-medium text-dark">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex gap-2">
                <button className="flex-1 rounded-lg border border-stroke py-2 text-sm font-medium text-dark hover:bg-gray-1 transition-colors">
                  View Records
                </button>
                <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                  Book Visit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <div className="rounded-full bg-gray-2 p-4 text-dark-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-dark">No patient selected</p>
              <p className="mt-1 text-xs text-dark-5">Click a row to view patient details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
