import { useMemo, useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatTime } from '../../lib/format';
import type { AppointmentStatus } from '../../types';

type Tab = 'all' | AppointmentStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'missed', label: 'Missed' },
];

/** Admin appointments: live list, status filter, and status management. */
export function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const { appointments, loading, error, reload } = useAppointments();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (tab === 'all' ? appointments : appointments.filter(a => a.status === tab)),
    [tab, appointments],
  );

  async function setStatus(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    await action();
    setBusyId(null);
    await reload();
  }

  function counts(status: AppointmentStatus) {
    return appointments.filter(a => a.status === status).length;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Appointments</h1>
          <p className="mt-1 text-sm text-dark-5">Manage bookings, reschedules, and chair assignments.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: appointments.length, color: 'text-dark' },
          { label: 'Pending', value: counts('pending'), color: 'text-dark-4' },
          { label: 'Scheduled', value: counts('scheduled'), color: 'text-primary' },
          { label: 'Completed', value: counts('completed'), color: 'text-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-stroke bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-dark-5">{label}</p>
            <p className={['mt-1 text-2xl font-bold', color].join(' ')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-stroke px-5 pt-4">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                'shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-dark-5 hover:text-dark',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden md:table-cell">Dentist</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 text-dark-5">{formatDate(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{formatTime(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{a.patient?.profile?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{a.doctor?.profile?.full_name ?? 'Unassigned'}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{a.procedure}</td>
                    <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {a.status !== 'completed' && (
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => void setStatus(a.id, () => AppointmentService.updateStatus(a.id, 'completed'))}
                            className="rounded-md px-2 py-1 text-xs font-medium text-green hover:bg-green-light/10 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                        {a.status !== 'missed' && (
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => void setStatus(a.id, () => AppointmentService.markMissed(a.id))}
                            className="rounded-md px-2 py-1 text-xs font-medium text-dark-5 hover:bg-gray-1 disabled:opacity-50"
                          >
                            Missed
                          </button>
                        )}
                        {a.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => void setStatus(a.id, () => AppointmentService.updateStatus(a.id, 'cancelled'))}
                            className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-dark-5">No appointments found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
