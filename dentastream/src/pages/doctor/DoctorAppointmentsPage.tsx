import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService, type AppointmentSort } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatTime } from '../../lib/format';
import type { Appointment } from '../../types';

const SORTS: { key: AppointmentSort; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'service', label: 'Type of service' },
  { key: 'status', label: 'Status' },
];

/** Doctor's own schedule, sortable by date / service / status. */
export function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<AppointmentSort>('date');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      const doctor = await DoctorService.getByProfileId(user.id);
      if (cancelled) return;
      if (doctor.error) { setError(doctor.error); setLoading(false); return; }
      if (!doctor.data) { setAppointments([]); setLoading(false); return; }
      const appts = await AppointmentService.listForDoctor(doctor.data.id, sortBy);
      if (cancelled) return;
      if (appts.error) setError(appts.error);
      else setAppointments(appts.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Chair Schedule</h1>
          <p className="mt-1 text-sm text-dark-5">Your appointments. Sort to plan your day.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-dark-5">
          Sort by
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as AppointmentSort)}
            className="rounded-lg border border-stroke bg-gray-1 px-3 py-2 text-sm text-dark outline-none focus:border-primary"
          >
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : appointments.length === 0 ? (
          <p className="py-10 text-center text-sm text-dark-5">No appointments assigned to you yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                  <th className="px-5 py-3 hidden md:table-cell">Room</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {appointments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 text-dark-5">{formatDate(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{formatTime(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-dark">{a.patient?.profile?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{a.procedure}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{a.room ?? '—'}</td>
                    <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
