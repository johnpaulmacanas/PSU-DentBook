import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatTime } from '../../lib/format';
import type { Appointment } from '../../types';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

/** Doctor home: today's cases and active patient count. */
export function DoctorDashboardPage() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const doctor = await DoctorService.getByProfileId(user.id);
      if (cancelled || !doctor.data) { setLoading(false); return; }
      const appts = await AppointmentService.listForDoctor(doctor.data.id);
      if (cancelled) return;
      setAppointments(appts.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const today = useMemo(
    () => appointments
      .filter(a => isToday(a.scheduled_at))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">
          Welcome{profile?.full_name ? `, Dr. ${profile.full_name.split(' ').slice(-1)[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-dark-5">Today&apos;s chair schedule and active cases.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Today's Cases", value: today.length },
          { label: 'Total Appointments', value: appointments.length },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-dark-5">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-dark">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Today&apos;s Schedule</h2>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : today.length === 0 ? (
          <p className="py-10 text-center text-sm text-dark-5">No cases scheduled today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Procedure</th>
                  <th className="px-5 py-3 hidden md:table-cell">Room</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {today.map(a => (
                  <tr key={a.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">{formatTime(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 text-dark">{a.patient?.profile?.full_name ?? '—'}</td>
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
