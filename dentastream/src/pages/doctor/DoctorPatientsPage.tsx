import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorService } from '../../services/DoctorService';
import { AppointmentService } from '../../services/AppointmentService';
import { MedicalCertificateService } from '../../services/MedicalCertificateService';
import { PrescriptionService } from '../../services/PrescriptionService';
import { TreatmentResultService } from '../../services/TreatmentResultService';
import { Field, controlClass } from '../../components/ui/Field';
import { formatDate } from '../../lib/format';
import type { Appointment, Prescription, TreatmentResult } from '../../types';

interface PatientRow {
  patientId: string;
  name: string;
  contact: string;
  lastAppointment: Appointment;
  appointments: Appointment[];
}

/** Doctor's patients with certificate, prescription, and treatment result issuance + clinical history. */
export function DoctorPatientsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Certificate modal
  const [certFor, setCertFor] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  // Prescription modal
  const [rxFor, setRxFor] = useState<Appointment | null>(null);
  const [rxMedication, setRxMedication] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('');
  const [rxDuration, setRxDuration] = useState('');
  const [rxNotes, setRxNotes] = useState('');

  // Treatment result modal
  const [resultFor, setResultFor] = useState<Appointment | null>(null);
  const [resultProcedure, setResultProcedure] = useState('');
  const [resultFindings, setResultFindings] = useState('');
  const [resultOutcome, setResultOutcome] = useState('');
  const [resultNotes, setResultNotes] = useState('');

  // Shared modal state
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Clinical history for expanded patient
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [patientRx, setPatientRx] = useState<Prescription[]>([]);
  const [patientResults, setPatientResults] = useState<TreatmentResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const rows = useMemo<PatientRow[]>(() => {
    const map = new Map<string, PatientRow>();
    for (const a of appointments) {
      if (!a.patient) continue;
      const existing = map.get(a.patient.id);
      if (!existing) {
        map.set(a.patient.id, {
          patientId: a.patient.id,
          name: a.patient.profile?.full_name ?? 'Unknown',
          contact: a.patient.profile?.contact ?? '—',
          lastAppointment: a,
          appointments: [a],
        });
      } else {
        existing.appointments.push(a);
        if (new Date(a.scheduled_at) > new Date(existing.lastAppointment.scheduled_at)) {
          existing.lastAppointment = a;
        }
      }
    }
    return [...map.values()];
  }, [appointments]);

  // --- Modal openers ---
  function openCert(appt: Appointment) {
    setCertFor(appt); setDiagnosis(''); setRecommendation(''); setValidFrom(''); setValidTo(''); setFormError(null);
  }
  function openRx(appt: Appointment) {
    setRxFor(appt); setRxMedication(''); setRxDosage(''); setRxFrequency(''); setRxDuration(''); setRxNotes(''); setFormError(null);
  }
  function openResult(appt: Appointment) {
    setResultFor(appt); setResultProcedure(appt.procedure); setResultFindings(''); setResultOutcome(''); setResultNotes(''); setFormError(null);
  }

  // --- Modal submitters ---
  async function issueCert() {
    if (!certFor || !user) return;
    setBusy(true);
    const { error } = await MedicalCertificateService.issue({
      appointment_id: certFor.id, issued_by: user.id,
      diagnosis: diagnosis || undefined, recommendation: recommendation || undefined,
      valid_from: validFrom || undefined, valid_to: validTo || undefined,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setNotice('Medical certificate issued.'); setCertFor(null);
  }

  async function createRx() {
    if (!rxFor || !user) return;
    if (!rxMedication.trim()) { setFormError('Medication is required.'); return; }
    setBusy(true);
    const { error } = await PrescriptionService.create({
      appointment_id: rxFor.id, prescribed_by: user.id,
      medication: rxMedication.trim(),
      dosage: rxDosage || undefined, frequency: rxFrequency || undefined,
      duration: rxDuration || undefined, notes: rxNotes || undefined,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setNotice('Prescription created.'); setRxFor(null);
  }

  async function createResult() {
    if (!resultFor || !user) return;
    if (!resultProcedure.trim()) { setFormError('Procedure performed is required.'); return; }
    setBusy(true);
    const { error } = await TreatmentResultService.create({
      appointment_id: resultFor.id, recorded_by: user.id,
      procedure_performed: resultProcedure.trim(),
      findings: resultFindings || undefined, outcome: resultOutcome || undefined,
      notes: resultNotes || undefined,
    });
    setBusy(false);
    if (error) { setFormError(error); return; }
    setNotice('Treatment result recorded.'); setResultFor(null);
  }

  // --- Clinical history ---
  async function toggleHistory(patientId: string, patientAppointments: Appointment[]) {
    if (expandedPatientId === patientId) { setExpandedPatientId(null); return; }
    setExpandedPatientId(patientId);
    setHistoryLoading(true);
    setPatientRx([]); setPatientResults([]);

    const allRx: Prescription[] = [];
    const allResults: TreatmentResult[] = [];
    for (const appt of patientAppointments) {
      const [rx, res] = await Promise.all([
        PrescriptionService.listForAppointment(appt.id),
        TreatmentResultService.listForAppointment(appt.id),
      ]);
      if (rx.data) allRx.push(...rx.data);
      if (res.data) allResults.push(...res.data);
    }
    setPatientRx(allRx);
    setPatientResults(allResults);
    setHistoryLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">My Patients</h1>
        <p className="mt-1 text-sm text-dark-5">Patients from your appointments. Issue certificates, prescriptions, and record results.</p>
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
                  <>
                    <tr key={r.patientId} className="hover:bg-gray-1">
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => void toggleHistory(r.patientId, r.appointments)} className="text-left">
                          <p className="font-medium text-dark">{r.name}</p>
                          <p className="text-xs text-dark-5">{expandedPatientId === r.patientId ? '▾ Hide history' : '▸ Show history'}</p>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{r.contact}</td>
                      <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">{formatDate(r.lastAppointment.scheduled_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => openRx(r.lastAppointment)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1">
                            Prescribe
                          </button>
                          <button type="button" onClick={() => openResult(r.lastAppointment)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1">
                            Record Result
                          </button>
                          <button type="button" onClick={() => openCert(r.lastAppointment)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1">
                            Certificate
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded clinical history */}
                    {expandedPatientId === r.patientId && (
                      <tr key={`${r.patientId}-history`}>
                        <td colSpan={4} className="bg-gray-1/50 px-5 py-4">
                          {historyLoading ? (
                            <p className="text-sm text-dark-5">Loading clinical history…</p>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Prescriptions */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-dark-5">Prescriptions</h4>
                                {patientRx.length === 0 ? (
                                  <p className="text-xs text-dark-5">None yet.</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {patientRx.map(rx => (
                                      <li key={rx.id} className="rounded-lg border border-stroke bg-white p-3">
                                        <p className="text-sm font-medium text-dark">{rx.medication}</p>
                                        <p className="text-xs text-dark-5">
                                          {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ') || '—'}
                                        </p>
                                        {rx.notes && <p className="mt-1 text-xs text-dark-4">{rx.notes}</p>}
                                        <p className="mt-1 text-xs text-dark-5">{formatDate(rx.created_at)}</p>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              {/* Treatment Results */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-dark-5">Treatment Results</h4>
                                {patientResults.length === 0 ? (
                                  <p className="text-xs text-dark-5">None yet.</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {patientResults.map(res => (
                                      <li key={res.id} className="rounded-lg border border-stroke bg-white p-3">
                                        <p className="text-sm font-medium text-dark">{res.procedure_performed}</p>
                                        {res.findings && <p className="text-xs text-dark-5">Findings: {res.findings}</p>}
                                        {res.outcome && <p className="text-xs text-dark-5">Outcome: {res.outcome}</p>}
                                        {res.notes && <p className="mt-1 text-xs text-dark-4">{res.notes}</p>}
                                        <p className="mt-1 text-xs text-dark-5">{formatDate(res.created_at)}</p>
                                      </li>
                                    ))}
                                  </ul>
                                )}
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
      </div>

      {/* ========== Modals ========== */}

      {/* Certificate Modal */}
      {certFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Issue Medical Certificate</h2>
            <p className="mt-1 text-sm text-dark-5">{certFor.patient?.profile?.full_name ?? 'Patient'} · {certFor.procedure}</p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Diagnosis"><input className={controlClass} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></Field>
              <Field label="Recommendation"><textarea className={controlClass} rows={2} value={recommendation} onChange={e => setRecommendation(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valid from"><input type="date" className={controlClass} value={validFrom} onChange={e => setValidFrom(e.target.value)} /></Field>
                <Field label="Valid to"><input type="date" className={controlClass} value={validTo} onChange={e => setValidTo(e.target.value)} /></Field>
              </div>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCertFor(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void issueCert()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Issuing…' : 'Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {rxFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Add Prescription</h2>
            <p className="mt-1 text-sm text-dark-5">{rxFor.patient?.profile?.full_name ?? 'Patient'} · {rxFor.procedure}</p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Medication" required><input className={controlClass} value={rxMedication} onChange={e => setRxMedication(e.target.value)} placeholder="e.g. Amoxicillin 500mg" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Dosage"><input className={controlClass} value={rxDosage} onChange={e => setRxDosage(e.target.value)} placeholder="e.g. 1 capsule" /></Field>
                <Field label="Frequency"><input className={controlClass} value={rxFrequency} onChange={e => setRxFrequency(e.target.value)} placeholder="e.g. 3x daily" /></Field>
              </div>
              <Field label="Duration"><input className={controlClass} value={rxDuration} onChange={e => setRxDuration(e.target.value)} placeholder="e.g. 7 days" /></Field>
              <Field label="Notes"><textarea className={controlClass} rows={2} value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Additional instructions…" /></Field>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setRxFor(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void createRx()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Creating…' : 'Add Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Result Modal */}
      {resultFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Record Treatment Result</h2>
            <p className="mt-1 text-sm text-dark-5">{resultFor.patient?.profile?.full_name ?? 'Patient'} · {resultFor.procedure}</p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Procedure performed" required><input className={controlClass} value={resultProcedure} onChange={e => setResultProcedure(e.target.value)} /></Field>
              <Field label="Findings"><textarea className={controlClass} rows={2} value={resultFindings} onChange={e => setResultFindings(e.target.value)} placeholder="Clinical findings…" /></Field>
              <Field label="Outcome"><input className={controlClass} value={resultOutcome} onChange={e => setResultOutcome(e.target.value)} placeholder="e.g. Successful, Requires follow-up" /></Field>
              <Field label="Notes"><textarea className={controlClass} rows={2} value={resultNotes} onChange={e => setResultNotes(e.target.value)} /></Field>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setResultFor(null)} className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void createResult()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {busy ? 'Recording…' : 'Record Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
