import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PatientService } from '../../services/PatientService';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../lib/format';
import { CLINIC } from '../../lib/clinic';
import type { Appointment } from '../../types';

/** Patient home: next upcoming appointment + quick actions. */
export function PatientDashboardPage() {
  const { user, profile } = useAuth();
  const [next, setNext] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const patient = await PatientService.getByProfileId(user.id);
      if (cancelled || !patient.data) { setLoading(false); return; }
      const appts = await AppointmentService.listForPatient(patient.data.id);
      if (cancelled) return;
      const now = Date.now();
      const upcoming = (appts.data ?? [])
        .filter(a => new Date(a.scheduled_at).getTime() >= now && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      setNext(upcoming[0] ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-dark-5">See your next visit and manage your care.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-3 font-semibold text-dark">Next Appointment</h2>
          {loading ? (
            <p className="text-sm text-dark-5">Loading…</p>
          ) : next ? (
            <div className="flex flex-col gap-2">
              <p className="text-lg font-bold text-dark">{next.procedure}</p>
              <p className="text-sm text-dark-5">{formatDateTime(next.scheduled_at)}</p>
              <p className="text-sm text-dark-5">
                Dentist: {next.doctor?.profile?.full_name ?? 'To be assigned'}
                {next.room ? ` · ${next.room}` : ''}
              </p>
              <div className="mt-1"><AppointmentStatusBadge status={next.status} /></div>
              {/* Appointment details patients receive after approval. */}
              <div className="mt-3 rounded-lg border border-stroke bg-gray-1 px-4 py-3 text-sm">
                <p className="font-medium text-dark">{CLINIC.name}</p>
                <p className="text-dark-5">{CLINIC.address}</p>
                <p className="text-dark-5">{CLINIC.phone} · {CLINIC.hours}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-dark-5">You have no upcoming appointments.</p>
              <Link to="/patient/request" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                Request an Appointment
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-dark">Quick Links</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link to="/patient/appointments" className="text-primary hover:underline">My appointments</Link></li>
            <li><Link to="/patient/billing" className="text-primary hover:underline">Billing &amp; certificates</Link></li>
            <li><Link to="/patient/profile" className="text-primary hover:underline">Update profile</Link></li>
            <li><Link to="/patient/chat" className="text-primary hover:underline">Messages</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
