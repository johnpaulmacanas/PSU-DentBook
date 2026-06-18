import { useState } from 'react';
import { useAppointmentRequests } from '../../hooks/useAppointmentRequests';
import { useDoctors } from '../../hooks/useDoctors';
import { AppointmentRequestService } from '../../services/AppointmentRequestService';
import { Field, controlClass } from '../../components/ui/Field';
import { concernLabel, formatDateTime, formatMoney } from '../../lib/format';
import type { AppointmentRequest } from '../../types';

/** Admin approval queue for patient appointment requests. */
export function RequestsPage() {
  const { requests, loading, error, reload } = useAppointmentRequests({ kind: 'pending' });
  const { doctors } = useDoctors();
  const [active, setActive] = useState<AppointmentRequest | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [room, setRoom] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Decline modal
  const [declineTarget, setDeclineTarget] = useState<AppointmentRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  function openApprove(req: AppointmentRequest) {
    setActive(req);
    setScheduledAt('');
    setDoctorId(req.preferred_doctor_id ?? '');
    setRoom('');
    setAmount(req.estimated_amount ? String(req.estimated_amount) : '');
    setFormError(null);
  }

  async function confirmApprove() {
    if (!active) return;
    if (!scheduledAt) { setFormError('Please set a date and time.'); return; }
    setBusy(true);
    const { error } = await AppointmentRequestService.approve(active.id, {
      scheduled_at: new Date(scheduledAt).toISOString(),
      doctor_id: doctorId || null,
      room: room || undefined,
      initial_amount: amount ? Number(amount) : 0,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setActive(null);
    await reload();
  }

  function openDecline(req: AppointmentRequest) {
    setDeclineTarget(req);
    setDeclineReason('');
  }

  async function confirmDecline() {
    if (!declineTarget) return;
    setDeclining(true);
    await AppointmentRequestService.decline(declineTarget.id);
    setDeclining(false);
    setDeclineTarget(null);
    await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Appointment Requests</h1>
        <p className="mt-1 text-sm text-dark-5">Review and approve patient booking requests.</p>
      </div>

      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Concern</th>
                  <th className="px-5 py-3 hidden md:table-cell">Preferred Dentist</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Estimate</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Requested</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">
                      {req.patient_profile?.full_name ?? 'Patient'}
                    </td>
                    <td className="px-5 py-3.5 text-dark">{concernLabel(req.concern)}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">
                      {req.preferred_doctor?.profile?.full_name ?? 'No preference'}
                    </td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">
                      {req.estimated_amount ? formatMoney(req.estimated_amount) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{formatDateTime(req.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openApprove(req)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecline(req)}
                          className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1"
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== Approve Modal ===== */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Schedule & Approve</h2>
            <p className="mt-1 text-sm text-dark-5">
              {active.patient_profile?.full_name ?? 'Patient'} · {concernLabel(active.concern)}
            </p>

            {/* Patient medical context */}
            {(active.allergies || active.medications || active.conditions || active.is_pregnant || active.emergency_contact_name) && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-amber-700">Patient Medical Info</p>
                <dl className="space-y-1.5 text-xs">
                  {active.allergies && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-dark-5">Allergies:</dt>
                      <dd className="text-dark">{active.allergies}</dd>
                    </div>
                  )}
                  {active.medications && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-dark-5">Medications:</dt>
                      <dd className="text-dark">{active.medications}</dd>
                    </div>
                  )}
                  {active.conditions && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-dark-5">Conditions:</dt>
                      <dd className="text-dark">{active.conditions}</dd>
                    </div>
                  )}
                  {active.is_pregnant && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-dark-5">Pregnant:</dt>
                      <dd className="font-medium text-red-600">Yes</dd>
                    </div>
                  )}
                  {active.emergency_contact_name && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-dark-5">Emergency:</dt>
                      <dd className="text-dark">
                        {active.emergency_contact_name}
                        {active.emergency_contact_relation ? ` (${active.emergency_contact_relation})` : ''}
                        {active.emergency_contact_number ? ` — ${active.emergency_contact_number}` : ''}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Patient notes */}
            {active.notes && (
              <div className="mt-3 rounded-lg bg-gray-1 p-3">
                <p className="text-xs font-medium text-dark-5">Patient notes:</p>
                <p className="mt-1 text-sm text-dark">{active.notes}</p>
              </div>
            )}

            {/* Estimated amount from intake */}
            {active.estimated_amount > 0 && (
              <p className="mt-3 text-sm text-dark-5">
                Patient's estimated amount: <span className="font-semibold text-dark">{formatMoney(active.estimated_amount)}</span>
              </p>
            )}

            <div className="mt-4 flex flex-col gap-4">
              <Field label="Date & time" required>
                <input type="datetime-local" className={controlClass} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </Field>
              <Field label="Assign dentist">
                <select className={controlClass} value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.profile?.full_name ?? 'Dentist'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Room">
                <input className={controlClass} value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 1" />
              </Field>
              <Field label="Initial invoice amount (₱)">
                <input type="number" min="0" step="0.01" className={controlClass} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </Field>
            </div>

            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmApprove()}
                disabled={busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? 'Approving…' : 'Approve & Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Decline Modal ===== */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Decline Request</h2>
            <p className="mt-1 text-sm text-dark-5">
              {declineTarget.patient_profile?.full_name ?? 'Patient'} · {concernLabel(declineTarget.concern)}
            </p>

            <div className="mt-4">
              <Field label="Reason for declining (optional)">
                <textarea
                  className={controlClass}
                  rows={3}
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="e.g. Clinic fully booked this week, please try again next week."
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDecline()}
                disabled={declining}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {declining ? 'Declining…' : 'Decline Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
