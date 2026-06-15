import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppointments } from '../../hooks/useAppointments';
import { useAppointmentRequests } from '../../hooks/useAppointmentRequests';
import { usePatients } from '../../hooks/usePatients';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatTime, formatDate } from '../../lib/format';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

/** Admin dashboard with live overview counts and today's schedule. */
export function DashboardPage() {
  const { appointments, loading } = useAppointments();
  const { requests } = useAppointmentRequests({ kind: 'pending' });
  const { patients } = usePatients();

  const today = useMemo(
    () => appointments
      .filter(a => isToday(a.scheduled_at))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments],
  );

  const cards = [
    { label: 'Total Appointments', value: appointments.length },
    { label: 'Pending Requests', value: requests.length },
    { label: "Today's Visits", value: today.length },
    { label: 'Patients', value: patients.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-dark-5">Overview of today&apos;s clinical workflow.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-dark-5">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-dark">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Today&apos;s Appointments</h2>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {today.length} visits
            </span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
          ) : today.length === 0 ? (
            <p className="py-10 text-center text-sm text-dark-5">No appointments scheduled today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3 hidden md:table-cell">Dentist</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {today.map(a => (
                    <tr key={a.id} className="hover:bg-gray-1">
                      <td className="px-5 py-3.5 font-medium text-dark">{formatTime(a.scheduled_at)}</td>
                      <td className="px-5 py-3.5 text-dark">{a.patient?.profile?.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{a.doctor?.profile?.full_name ?? 'Unassigned'}</td>
                      <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-stroke bg-white shadow-sm">
          <div className="border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Pending Requests</h2>
            <p className="mt-0.5 text-xs text-dark-5">Awaiting approval</p>
          </div>
          {requests.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-dark-5">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-stroke px-5">
              {requests.slice(0, 5).map(r => (
                <li key={r.id} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dark">{r.patient_profile?.full_name ?? 'Patient'}</p>
                    <p className="text-xs text-dark-5">{formatDate(r.created_at)}</p>
                  </div>
                  <Link to="/requests" className="shrink-0 text-xs font-medium text-primary hover:underline">Review</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
