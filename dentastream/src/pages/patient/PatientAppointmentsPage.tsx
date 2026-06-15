import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentRequests } from '../../hooks/useAppointmentRequests';
import { PatientService } from '../../services/PatientService';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge, RequestStatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime, concernLabel } from '../../lib/format';
import type { Appointment } from '../../types';

/**
 * Patient view of their own appointments + pending requests. Resolves the
 * patient's clinical row from their profile, then lists scheduled visits.
 */
export function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { requests } = useAppointmentRequests(
    user ? { kind: 'mine', profileId: user.id } : { kind: 'pending' }
  );

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      const patient = await PatientService.getByProfileId(user.id);
      if (cancelled) return;
      if (patient.error) { setError(patient.error); setLoading(false); return; }
      if (!patient.data) { setAppointments([]); setLoading(false); return; }
      const appts = await AppointmentService.listForPatient(patient.data.id);
      if (cancelled) return;
      if (appts.error) setError(appts.error);
      else setAppointments(appts.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pendingRequests = requests.filter(r => r.request_status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">My Appointments</h1>
          <p className="mt-1 text-sm text-dark-5">View your upcoming dental visits and requests.</p>
        </div>
        <Link
          to="/patient/request"
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + Request Appointment
        </Link>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <section className="rounded-xl border border-stroke bg-white shadow-sm">
          <div className="border-b border-stroke px-5 py-4">
            <h2 className="font-semibold text-dark">Pending Requests</h2>
          </div>
          <ul className="divide-y divide-stroke">
            {pendingRequests.map(r => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-dark">{concernLabel(r.concern)}</p>
                  <p className="text-xs text-dark-5">Requested {formatDateTime(r.created_at)}</p>
                </div>
                <RequestStatusBadge status={r.request_status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Scheduled appointments */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Scheduled Visits</h2>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : appointments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">
            No appointments yet. Request one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Procedure</th>
                  <th className="px-5 py-3 hidden md:table-cell">Dentist</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {appointments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">{formatDateTime(a.scheduled_at)}</td>
                    <td className="px-5 py-3.5 text-dark">{a.procedure}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">
                      {a.doctor?.profile?.full_name ?? 'To be assigned'}
                    </td>
                    <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
