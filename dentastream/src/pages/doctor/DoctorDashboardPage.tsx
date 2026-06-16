import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { Field, controlClass } from '../../components/ui/Field';
import { formatTime } from '../../lib/format';
import type { Appointment } from '../../types';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

/** Doctor home: today's cases, stats, and quick-action buttons. */
export function DoctorDashboardPage() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setDoctorId] = useState<string | null>(null);

  // Visit notes modal
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  async function loadAll(cancelled: { current: boolean }) {
    if (!user) return;
    const doctor = await DoctorService.getByProfileId(user.id);
    if (cancelled.current || !doctor.data) { setLoading(false); return; }
    setDoctorId(doctor.data.id);
    const appts = await AppointmentService.listForDoctor(doctor.data.id);
    if (cancelled.current) return;
    setAppointments(appts.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelled = { current: false };
    void loadAll(cancelled);
    return () => { cancelled.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function reload() {
    const cancelled = { current: false };
    await loadAll(cancelled);
  }

  const today = useMemo(
    () => appointments
      .filter(a => isToday(a.scheduled_at))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments],
  );

  async function markCompleted(id: string) {
    setBusyId(id);
    await AppointmentService.updateStatus(id, 'completed');
    setBusyId(null);
    await reload();
  }

  function openNotes(a: Appointment) {
    setNotesTarget(a);
    setVisitNotes(a.visit_notes ?? '');
    setNotesError(null);
  }

  async function saveNotes() {
    if (!notesTarget) return;
    setNotesBusy(true);
    const { error } = await AppointmentService.update(notesTarget.id, { visit_notes: visitNotes });
    setNotesBusy(false);
    if (error) { setNotesError(error); return; }
    setNotesTarget(null);
    await reload();
  }

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
                  <th className="px-5 py-3 text-right">Actions</th>
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openNotes(a)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          Notes
                        </button>
                        {(a.status === 'scheduled' || a.status === 'rescheduled') && (
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => void markCompleted(a.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-green hover:bg-green-light/10 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visit Notes Modal */}
      {notesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Visit Notes</h2>
            <p className="mt-1 text-sm text-dark-5">
              {notesTarget.patient?.profile?.full_name ?? 'Patient'} · {notesTarget.procedure}
            </p>
            <div className="mt-4">
              <Field label="Clinical notes">
                <textarea className={controlClass} rows={5} value={visitNotes} onChange={e => setVisitNotes(e.target.value)} placeholder="Observations, treatment notes, follow-up plan…" />
              </Field>
            </div>
            {notesError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{notesError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setNotesTarget(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void saveNotes()} disabled={notesBusy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {notesBusy ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
