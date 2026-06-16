import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService, type AppointmentSort } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { Field, controlClass } from '../../components/ui/Field';
import { formatDate, formatTime } from '../../lib/format';
import type { Appointment } from '../../types';

const SORTS: { key: AppointmentSort; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'service', label: 'Type of service' },
  { key: 'status', label: 'Status' },
];

/** Doctor's own schedule, with sort, status control, and visit notes. */
export function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<AppointmentSort>('date');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setDoctorId] = useState<string | null>(null);

  // Visit notes modal
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  async function loadAppointments(cancelled: { current: boolean }) {
    if (!user) return;
    setLoading(true);
    const doctor = await DoctorService.getByProfileId(user.id);
    if (cancelled.current) return;
    if (doctor.error) { setError(doctor.error); setLoading(false); return; }
    if (!doctor.data) { setAppointments([]); setLoading(false); return; }
    setDoctorId(doctor.data.id);
    const appts = await AppointmentService.listForDoctor(doctor.data.id, sortBy);
    if (cancelled.current) return;
    if (appts.error) setError(appts.error);
    else setAppointments(appts.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelled = { current: false };
    void loadAppointments(cancelled);
    return () => { cancelled.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy]);

  async function reload() {
    const cancelled = { current: false };
    await loadAppointments(cancelled);
  }

  async function updateStatus(id: string, status: 'completed' | 'cancelled') {
    setBusyId(id);
    await AppointmentService.updateStatus(id, status);
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
                  <th className="px-5 py-3 text-right">Actions</th>
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
                            onClick={() => void updateStatus(a.id, 'completed')}
                            className="rounded-md px-2 py-1 text-xs font-medium text-green hover:bg-green-light/10 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => void updateStatus(a.id, 'cancelled')}
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
                <textarea
                  className={controlClass}
                  rows={5}
                  value={visitNotes}
                  onChange={e => setVisitNotes(e.target.value)}
                  placeholder="Observations, treatment notes, follow-up plan…"
                />
              </Field>
            </div>
            {notesError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{notesError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setNotesTarget(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">
                Cancel
              </button>
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
