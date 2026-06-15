import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService } from '../../services/AppointmentService';
import { MedicalCertificateService } from '../../services/MedicalCertificateService';
import { Field, controlClass } from '../../components/ui/Field';
import { formatDate } from '../../lib/format';
import type { Appointment } from '../../types';

interface PatientRow {
  patientId: string;
  name: string;
  contact: string;
  lastAppointment: Appointment;
}

/** Doctor's patients (derived from their appointments) + certificate issuance. */
export function DoctorPatientsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Certificate modal state (keyed to a specific appointment).
  const [certFor, setCertFor] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      const doctor = await DoctorService.getByProfileId(user.id);
      if (cancelled) return;
      if (doctor.error) { setError(doctor.error); setLoading(false); return; }
      if (!doctor.data) { setAppointments([]); setLoading(false); return; }
      const appts = await AppointmentService.listForDoctor(doctor.data.id);
      if (cancelled) return;
      if (appts.error) setError(appts.error);
      else setAppointments(appts.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Collapse appointments to unique patients, keeping the most recent visit.
  const rows = useMemo<PatientRow[]>(() => {
    const map = new Map<string, PatientRow>();
    for (const a of appointments) {
      if (!a.patient) continue;
      const existing = map.get(a.patient.id);
      if (!existing || new Date(a.scheduled_at) > new Date(existing.lastAppointment.scheduled_at)) {
        map.set(a.patient.id, {
          patientId: a.patient.id,
          name: a.patient.profile?.full_name ?? 'Unknown',
          contact: a.patient.profile?.contact ?? '—',
          lastAppointment: a,
        });
      }
    }
    return [...map.values()];
  }, [appointments]);

  function openCert(appt: Appointment) {
    setCertFor(appt);
    setDiagnosis('');
    setRecommendation('');
    setValidFrom('');
    setValidTo('');
    setFormError(null);
  }

  async function issueCert() {
    if (!certFor || !user) return;
    setBusy(true);
    const { error } = await MedicalCertificateService.issue({
      appointment_id: certFor.id,
      issued_by: user.id,
      diagnosis: diagnosis || undefined,
      recommendation: recommendation || undefined,
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setNotice('Medical certificate issued.');
    setCertFor(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">My Patients</h1>
        <p className="mt-1 text-sm text-dark-5">Patients from your appointments.</p>
      </div>

      {notice && <p className="rounded-lg bg-green-light/20 px-3 py-2 text-sm text-green">{notice}</p>}

      <div className="rounded-xl border border-stroke bg-white shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-dark-5">No patients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3 hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Last Visit</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {rows.map(r => (
                  <tr key={r.patientId} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">{r.name}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{r.contact}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{formatDate(r.lastAppointment.scheduled_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openCert(r.lastAppointment)}
                        className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1"
                      >
                        Issue Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate modal */}
      {certFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Issue Medical Certificate</h2>
            <p className="mt-1 text-sm text-dark-5">
              {certFor.patient?.profile?.full_name ?? 'Patient'} · {certFor.procedure}
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <Field label="Diagnosis">
                <input className={controlClass} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              </Field>
              <Field label="Recommendation">
                <textarea className={controlClass} rows={2} value={recommendation} onChange={e => setRecommendation(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valid from">
                  <input type="date" className={controlClass} value={validFrom} onChange={e => setValidFrom(e.target.value)} />
                </Field>
                <Field label="Valid to">
                  <input type="date" className={controlClass} value={validTo} onChange={e => setValidTo(e.target.value)} />
                </Field>
              </div>
            </div>

            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCertFor(null)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void issueCert()}
                disabled={busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? 'Issuing…' : 'Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
