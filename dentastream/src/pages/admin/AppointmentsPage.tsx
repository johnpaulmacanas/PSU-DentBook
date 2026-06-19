import { useMemo, useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { useDoctors } from '../../hooks/useDoctors';
import { AppointmentService } from '../../services/AppointmentService';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { Field, controlClass } from '../../components/ui/Field';
import { formatDate, formatTime } from '../../lib/format';
import type { Appointment, AppointmentStatus } from '../../types';

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

type ModalMode = 'new' | 'reschedule' | 'edit' | null;

/** Admin appointments: live list, status filter, status management, and new appointment/reschedule/edit modals. */
export function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const { appointments, loading, error, reload } = useAppointments();
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New appointment form
  const [newPatientId, setNewPatientId] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  const [newRoom, setNewRoom] = useState('');

  // Reschedule form
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Edit form
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  function openNew() {
    setNewPatientId(''); setNewDoctorId(''); setNewDate(''); setNewProcedure(''); setNewRoom('');
    setFormError(null);
    setModal('new');
  }

  function openReschedule(a: Appointment) {
    setEditTarget(a);
    setRescheduleDate('');
    setFormError(null);
    setModal('reschedule');
  }

  function openEdit(a: Appointment) {
    setEditTarget(a);
    setEditDoctorId(a.doctor_id ?? '');
    setEditRoom(a.room ?? '');
    setEditNotes(a.notes ?? '');
    setFormError(null);
    setModal('edit');
  }

  async function createAppointment() {
    if (!newPatientId) { setFormError('Please select a patient.'); return; }
    if (!newDate) { setFormError('Please set a date and time.'); return; }
    if (!newProcedure.trim()) { setFormError('Please enter a procedure.'); return; }
    setBusy(true);
    const { error } = await AppointmentService.create({
      patient_id: newPatientId,
      doctor_id: newDoctorId || null,
      scheduled_at: new Date(newDate).toISOString(),
      procedure: newProcedure.trim(),
      room: newRoom || undefined,
      status: 'scheduled',
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setModal(null);
    await reload();
  }

  async function confirmReschedule() {
    if (!editTarget) return;
    if (!rescheduleDate) { setFormError('Please set a new date and time.'); return; }
    setBusy(true);
    const { error } = await AppointmentService.reschedule(editTarget.id, new Date(rescheduleDate).toISOString());
    setBusy(false);
    if (error) { setFormError(error); return; }
    setModal(null);
    setEditTarget(null);
    await reload();
  }

  async function confirmEdit() {
    if (!editTarget) return;
    setBusy(true);
    const { error } = await AppointmentService.update(editTarget.id, {
      doctor_id: editDoctorId || undefined,
      room: editRoom,
      notes: editNotes,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setModal(null);
    setEditTarget(null);
    await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Appointments</h1>
          <p className="mt-1 text-sm text-dark-5">Manage bookings, reschedules, and chair assignments.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          + New Appointment
        </button>
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
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        {(a.status === 'scheduled' || a.status === 'rescheduled') && (
                          <button
                            type="button"
                            onClick={() => openReschedule(a)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-dark-4 hover:bg-gray-1 disabled:opacity-50"
                          >
                            Reschedule
                          </button>
                        )}
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

      {/* ========== Modals ========== */}

      {/* New Appointment Modal */}
      {modal === 'new' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">New Appointment</h2>
            <p className="mt-1 text-sm text-dark-5">Create a walk-in or phone booking directly.</p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Patient" required>
                <select className={controlClass} value={newPatientId} onChange={e => setNewPatientId(e.target.value)}>
                  <option value="">Select patient…</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.profile?.full_name ?? p.patient_code}</option>
                  ))}
                </select>
              </Field>
              <Field label="Assign dentist">
                <select className={controlClass} value={newDoctorId} onChange={e => setNewDoctorId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.profile?.full_name ?? 'Dentist'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date & time" required>
                <input type="datetime-local" className={controlClass} value={newDate} onChange={e => setNewDate(e.target.value)} />
              </Field>
              <Field label="Procedure" required>
                <input className={controlClass} value={newProcedure} onChange={e => setNewProcedure(e.target.value)} placeholder="e.g. Check-up / Cleaning" />
              </Field>
              <Field label="Room">
                <input className={controlClass} value={newRoom} onChange={e => setNewRoom(e.target.value)} placeholder="e.g. Room 1" />
              </Field>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void createAppointment()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Creating…' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {modal === 'reschedule' && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Reschedule Appointment</h2>
            <p className="mt-1 text-sm text-dark-5">
              {editTarget.patient?.profile?.full_name ?? 'Patient'} · {editTarget.procedure}
            </p>
            <div className="mt-4">
              <Field label="New date & time" required>
                <input type="datetime-local" className={controlClass} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
              </Field>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setModal(null); setEditTarget(null); }} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void confirmReschedule()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Rescheduling…' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Edit Appointment</h2>
            <p className="mt-1 text-sm text-dark-5">
              {editTarget.patient?.profile?.full_name ?? 'Patient'} · {formatDate(editTarget.scheduled_at)}
            </p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Assign dentist">
                <select className={controlClass} value={editDoctorId} onChange={e => setEditDoctorId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.profile?.full_name ?? 'Dentist'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Room">
                <input className={controlClass} value={editRoom} onChange={e => setEditRoom(e.target.value)} placeholder="e.g. Room 1" />
              </Field>
              <Field label="Notes">
                <textarea className={controlClass} rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Admin notes…" />
              </Field>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setModal(null); setEditTarget(null); }} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void confirmEdit()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
