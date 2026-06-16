import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentRequests } from '../../hooks/useAppointmentRequests';
import { PatientService } from '../../services/PatientService';
import { AppointmentService } from '../../services/AppointmentService';
import { PrescriptionService } from '../../services/PrescriptionService';
import { TreatmentResultService } from '../../services/TreatmentResultService';
import { MedicalCertificateService } from '../../services/MedicalCertificateService';
import { AppointmentStatusBadge, RequestStatusBadge } from '../../components/ui/StatusBadge';
import { AppointmentRequestService } from '../../services/AppointmentRequestService';
import { formatDateTime, formatDate, concernLabel } from '../../lib/format';
import type { Appointment, Prescription, TreatmentResult, MedicalCertificate } from '../../types';

/**
 * Patient view of their appointments + pending requests. Click a row to see
 * full visit details: notes, prescriptions, treatment results, and certificates.
 */
export function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { requests, reload: reloadRequests } = useAppointmentRequests(
    user ? { kind: 'mine', profileId: user.id } : { kind: 'pending' }
  );

  // Detail panel state
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [detailRx, setDetailRx] = useState<Prescription[]>([]);
  const [detailResults, setDetailResults] = useState<TreatmentResult[]>([]);
  const [detailCerts, setDetailCerts] = useState<MedicalCertificate[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel request state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  async function selectAppointment(a: Appointment) {
    if (selected?.id === a.id) { setSelected(null); return; }
    setSelected(a);
    setDetailLoading(true);
    const [rx, res, certs] = await Promise.all([
      PrescriptionService.listForAppointment(a.id),
      TreatmentResultService.listForAppointment(a.id),
      MedicalCertificateService.listForAppointment(a.id),
    ]);
    setDetailRx(rx.data ?? []);
    setDetailResults(res.data ?? []);
    setDetailCerts(certs.data ?? []);
    setDetailLoading(false);
  }

  async function cancelRequest(requestId: string) {
    setCancellingId(requestId);
    await AppointmentRequestService.cancel(requestId);
    setCancellingId(null);
    await reloadRequests();
  }

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

      {/* Pending requests with cancel button */}
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
                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={r.request_status} />
                  <button
                    type="button"
                    onClick={() => void cancelRequest(r.id)}
                    disabled={cancellingId === r.id}
                    className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Scheduled appointments */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Scheduled Visits</h2>
          <p className="mt-0.5 text-xs text-dark-5">Click a row to see visit details.</p>
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
                  <>
                    <tr
                      key={a.id}
                      onClick={() => void selectAppointment(a)}
                      className={[
                        'cursor-pointer transition-colors hover:bg-gray-1',
                        selected?.id === a.id ? 'bg-primary/5' : '',
                      ].join(' ')}
                    >
                      <td className="px-5 py-3.5 font-medium text-dark">{formatDateTime(a.scheduled_at)}</td>
                      <td className="px-5 py-3.5 text-dark">{a.procedure}</td>
                      <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">
                        {a.doctor?.profile?.full_name ?? 'To be assigned'}
                      </td>
                      <td className="px-5 py-3.5"><AppointmentStatusBadge status={a.status} /></td>
                    </tr>

                    {/* Expanded detail row */}
                    {selected?.id === a.id && (
                      <tr key={`${a.id}-detail`}>
                        <td colSpan={4} className="bg-gray-1/50 px-5 py-4">
                          {detailLoading ? (
                            <p className="text-sm text-dark-5">Loading details…</p>
                          ) : (
                            <div className="space-y-4">
                              {/* Appointment info */}
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                                <div>
                                  <p className="text-xs font-medium text-dark-5">Room</p>
                                  <p className="text-dark">{a.room ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-dark-5">Dentist</p>
                                  <p className="text-dark">{a.doctor?.profile?.full_name ?? 'Unassigned'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-dark-5">Notes</p>
                                  <p className="text-dark">{a.notes ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-dark-5">Status</p>
                                  <AppointmentStatusBadge status={a.status} />
                                </div>
                              </div>

                              {/* Visit Notes */}
                              {a.visit_notes && (
                                <div className="rounded-lg border border-stroke bg-white p-3">
                                  <h4 className="mb-1 text-xs font-semibold uppercase text-dark-5">Doctor's Visit Notes</h4>
                                  <p className="text-sm text-dark whitespace-pre-wrap">{a.visit_notes}</p>
                                </div>
                              )}

                              <div className="grid gap-4 md:grid-cols-3">
                                {/* Prescriptions */}
                                <div>
                                  <h4 className="mb-2 text-xs font-semibold uppercase text-dark-5">Prescriptions</h4>
                                  {detailRx.length === 0 ? (
                                    <p className="text-xs text-dark-5">None.</p>
                                  ) : (
                                    <ul className="space-y-2">
                                      {detailRx.map(rx => (
                                        <li key={rx.id} className="rounded-lg border border-stroke bg-white p-3">
                                          <p className="text-sm font-medium text-dark">{rx.medication}</p>
                                          <p className="text-xs text-dark-5">
                                            {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ') || '—'}
                                          </p>
                                          {rx.notes && <p className="mt-1 text-xs text-dark-4">{rx.notes}</p>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                {/* Treatment Results */}
                                <div>
                                  <h4 className="mb-2 text-xs font-semibold uppercase text-dark-5">Treatment Results</h4>
                                  {detailResults.length === 0 ? (
                                    <p className="text-xs text-dark-5">None.</p>
                                  ) : (
                                    <ul className="space-y-2">
                                      {detailResults.map(res => (
                                        <li key={res.id} className="rounded-lg border border-stroke bg-white p-3">
                                          <p className="text-sm font-medium text-dark">{res.procedure_performed}</p>
                                          {res.findings && <p className="text-xs text-dark-5">Findings: {res.findings}</p>}
                                          {res.outcome && <p className="text-xs text-dark-5">Outcome: {res.outcome}</p>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                {/* Certificates */}
                                <div>
                                  <h4 className="mb-2 text-xs font-semibold uppercase text-dark-5">Certificates</h4>
                                  {detailCerts.length === 0 ? (
                                    <p className="text-xs text-dark-5">None.</p>
                                  ) : (
                                    <ul className="space-y-2">
                                      {detailCerts.map(cert => (
                                        <li key={cert.id} className="rounded-lg border border-stroke bg-white p-3">
                                          <p className="text-sm font-medium text-dark">{cert.diagnosis ?? 'Medical certificate'}</p>
                                          <p className="text-xs text-dark-5">Issued {formatDate(cert.issued_at)}</p>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
