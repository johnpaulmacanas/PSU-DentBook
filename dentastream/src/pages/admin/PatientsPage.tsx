import { useEffect, useMemo, useState } from 'react';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments } from '../../hooks/useAppointments';
import { PatientService } from '../../services/PatientService';
import { ProfileService } from '../../services/ProfileService';
import { AppointmentService } from '../../services/AppointmentService';
import { PrescriptionService } from '../../services/PrescriptionService';
import { TreatmentResultService } from '../../services/TreatmentResultService';
import { Field, controlClass } from '../../components/ui/Field';
import { formatDate } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import type { Patient, Prescription, TreatmentResult } from '../../types';

/** Admin patient directory with clinical data editing, clinical history, and walk-in registration. */
export function PatientsPage() {
  const { patients, loading, error, reload } = usePatients();
  const { appointments } = useAppointments();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    age: '', gender: '', medical_notes: '',
    full_name: '', contact: '', address: '', birthdate: '', sex: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Clinical history
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientRx, setPatientRx] = useState<Prescription[]>([]);
  const [patientResults, setPatientResults] = useState<TreatmentResult[]>([]);

  // Add patient modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', full_name: '', contact: '' });
  const [addBusy, setAddBusy] = useState(false);

  // Appointment counts and last visit per patient
  const patientStats = useMemo(() => {
    const stats: Record<string, { count: number; lastVisit: string | null }> = {};
    for (const a of appointments) {
      if (!stats[a.patient_id]) stats[a.patient_id] = { count: 0, lastVisit: null };
      stats[a.patient_id].count++;
      if (a.status === 'completed') {
        const existing = stats[a.patient_id].lastVisit;
        if (!existing || a.scheduled_at > existing) stats[a.patient_id].lastVisit = a.scheduled_at;
      }
    }
    return stats;
  }, [appointments]);

  // Sync the edit form whenever the selected patient changes.
  useEffect(() => {
    setEditing(false);
    setSaveError(null);
    setForm({
      age: selected?.age != null ? String(selected.age) : '',
      gender: selected?.gender ?? '',
      medical_notes: selected?.medical_notes ?? '',
      full_name: selected?.profile?.full_name ?? '',
      contact:   selected?.profile?.contact ?? '',
      address:   selected?.profile?.address ?? '',
      birthdate: selected?.profile?.birthdate ?? '',
      sex:       selected?.profile?.sex ?? '',
    });

    // Load clinical history for selected patient
    if (selected) {
      (async () => {
        setHistoryLoading(true);
        setPatientRx([]); setPatientResults([]);
        const appts = await AppointmentService.listForPatient(selected.id);
        const appointmentList = appts.data ?? [];
        const allRx: Prescription[] = [];
        const allResults: TreatmentResult[] = [];
        for (const a of appointmentList) {
          const [rx, res] = await Promise.all([
            PrescriptionService.listForAppointment(a.id),
            TreatmentResultService.listForAppointment(a.id),
          ]);
          if (rx.data) allRx.push(...rx.data);
          if (res.data) allResults.push(...res.data);
        }
        setPatientRx(allRx);
        setPatientResults(allResults);
        setHistoryLoading(false);
      })();
    }
  }, [selected]);

  async function savePatient() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);

    const profileUpdate = await ProfileService.update(selected.profile_id, {
      full_name: form.full_name || undefined,
      contact:   form.contact   || undefined,
      address:   form.address   || undefined,
      birthdate: form.birthdate || undefined,
      sex: (form.sex as 'M' | 'F' | 'other') || undefined,
    });
    if (profileUpdate.error) {
      setSaving(false);
      setSaveError(profileUpdate.error);
      return;
    }

    const { data, error } = await PatientService.update(selected.id, {
      age: form.age ? Number(form.age) : null,
      gender: (form.gender as 'M' | 'F' | 'other') || null,
      medical_notes: form.medical_notes || null,
    });
    setSaving(false);
    if (error) { setSaveError(error); return; }
    if (data) {
      // Re-attach the freshly-updated profile so the detail pane reflects edits.
      setSelected({ ...data, profile: profileUpdate.data ?? data.profile });
    }
    setEditing(false);
    await reload();
  }

  async function addPatient() {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      setNotice('Please fill in all required fields.');
      return;
    }
    setAddBusy(true);
    setNotice(null);

    const { data, error } = await supabase.functions.invoke('invite-staff', {
      body: {
        email: addForm.email,
        password: addForm.password,
        full_name: addForm.full_name,
        role: 'patient',
      },
    });

    setAddBusy(false);

    if (error) { setNotice(`Error: ${error.message}`); return; }
    if (data?.error) { setNotice(`Error: ${data.error}`); return; }

    setNotice(`Patient account created for ${addForm.full_name}!`);
    setShowAddPatient(false);
    setAddForm({ email: '', password: '', full_name: '', contact: '' });
    await reload();
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p =>
      (p.profile?.full_name ?? '').toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q)
    );
  }, [patients, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Patients</h1>
          <p className="mt-1 text-sm text-dark-5">Search and manage patient records.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddPatient(true)}
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          + Add Patient
        </button>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {/* List */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-stroke p-4">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or patient code…"
              className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
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
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Code</th>
                    <th className="px-5 py-3 hidden md:table-cell">Contact</th>
                    <th className="px-5 py-3 hidden lg:table-cell text-center">Appts</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {filtered.map(p => {
                    const stats = patientStats[p.id];
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className={[
                          'cursor-pointer transition-colors hover:bg-gray-1',
                          selected?.id === p.id ? 'bg-primary/5' : '',
                        ].join(' ')}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(p.profile?.full_name ?? '?')[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-dark">{p.profile?.full_name ?? 'Unknown'}</p>
                              <p className="text-xs text-dark-5">
                                {p.age ? `${p.age}y` : '—'}{p.gender ? ` · ${p.gender}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-dark-5 hidden sm:table-cell">{p.patient_code}</td>
                        <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{p.profile?.contact ?? '—'}</td>
                        <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {stats?.count ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-dark-5 hidden lg:table-cell">
                          {stats?.lastVisit ? formatDate(stats.lastVisit) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-dark-5">No patients found.</p>
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="rounded-xl border border-stroke bg-white shadow-sm">
          {selected ? (
            <div className="p-5">
              <div className="flex items-center gap-4 border-b border-stroke pb-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {(selected.profile?.full_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-dark">{selected.profile?.full_name ?? 'Unknown'}</h3>
                  <p className="text-sm text-dark-5">{selected.patient_code}</p>
                </div>
              </div>

              {editing ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-dark-5">Identity &amp; Contact</p>
                  <Field label="Full name">
                    <input className={controlClass} value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                  </Field>
                  <Field label="Phone">
                    <input className={controlClass} value={form.contact}
                      onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
                  </Field>
                  <Field label="Address">
                    <input className={controlClass} value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Birthdate">
                      <input type="date" className={controlClass} value={form.birthdate}
                        onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
                    </Field>
                    <Field label="Sex">
                      <select className={controlClass} value={form.sex}
                        onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}>
                        <option value="">—</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                  </div>

                  <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-dark-5">Clinical</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age">
                      <input type="number" min="0" className={controlClass} value={form.age}
                        onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                    </Field>
                    <Field label="Gender">
                      <select className={controlClass} value={form.gender}
                        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                        <option value="">—</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Medical notes">
                    <textarea rows={3} className={controlClass} value={form.medical_notes}
                      onChange={e => setForm(f => ({ ...f, medical_notes: e.target.value }))} />
                  </Field>
                  {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{saveError}</p>}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing(false)}
                      className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-1">
                      Cancel
                    </button>
                    <button type="button" onClick={() => void savePatient()} disabled={saving}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      { label: 'Age', value: selected.age ? `${selected.age} years old` : '—' },
                      { label: 'Gender', value: selected.gender ?? '—' },
                      { label: 'Contact', value: selected.profile?.contact ?? '—' },
                      { label: 'Address', value: selected.profile?.address ?? '—' },
                      { label: 'Appointments', value: String(patientStats[selected.id]?.count ?? 0) },
                      { label: 'Last visit', value: patientStats[selected.id]?.lastVisit ? formatDate(patientStats[selected.id].lastVisit!) : '—' },
                      { label: 'Medical notes', value: selected.medical_notes ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <dt className="text-dark-5">{label}</dt>
                        <dd className="text-right font-medium text-dark">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <button type="button" onClick={() => setEditing(true)}
                    className="mt-5 w-full rounded-lg border border-stroke py-2 text-sm font-medium text-dark hover:bg-gray-1">
                    Edit patient info
                  </button>
                </>
              )}

              {/* Clinical History */}
              <div className="mt-5 border-t border-stroke pt-4">
                <h4 className="mb-3 text-xs font-semibold uppercase text-dark-5">Clinical History</h4>
                {historyLoading ? (
                  <p className="text-xs text-dark-5">Loading…</p>
                ) : (
                  <div className="space-y-4">
                    {/* Prescriptions */}
                    <div>
                      <p className="mb-1 text-xs font-medium text-dark-4">Prescriptions ({patientRx.length})</p>
                      {patientRx.length === 0 ? (
                        <p className="text-xs text-dark-5">None.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {patientRx.slice(0, 5).map(rx => (
                            <li key={rx.id} className="rounded border border-stroke bg-gray-1 px-3 py-2">
                              <p className="text-xs font-medium text-dark">{rx.medication}</p>
                              <p className="text-xs text-dark-5">
                                {[rx.dosage, rx.frequency].filter(Boolean).join(' · ') || '—'}
                                {' · '}{formatDate(rx.created_at)}
                              </p>
                            </li>
                          ))}
                          {patientRx.length > 5 && <p className="text-xs text-dark-5">+{patientRx.length - 5} more</p>}
                        </ul>
                      )}
                    </div>
                    {/* Treatment Results */}
                    <div>
                      <p className="mb-1 text-xs font-medium text-dark-4">Treatment Results ({patientResults.length})</p>
                      {patientResults.length === 0 ? (
                        <p className="text-xs text-dark-5">None.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {patientResults.slice(0, 5).map(res => (
                            <li key={res.id} className="rounded border border-stroke bg-gray-1 px-3 py-2">
                              <p className="text-xs font-medium text-dark">{res.procedure_performed}</p>
                              <p className="text-xs text-dark-5">
                                {res.outcome ?? '—'} · {formatDate(res.created_at)}
                              </p>
                            </li>
                          ))}
                          {patientResults.length > 5 && <p className="text-xs text-dark-5">+{patientResults.length - 5} more</p>}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <p className="text-sm font-medium text-dark">No patient selected</p>
              <p className="mt-1 text-xs text-dark-5">Click a row to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Add Patient Modal ===== */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Add Patient</h2>
            <p className="mt-1 text-sm text-dark-5">Register a walk-in patient. They can log in immediately.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Full Name *</label>
                <input className={controlClass} placeholder="Juan Dela Cruz"
                  value={addForm.full_name}
                  onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Email *</label>
                <input type="email" className={controlClass} placeholder="patient@email.com"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Temporary Password *</label>
                <input type="text" className={controlClass} placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Contact (optional)</label>
                <input className={controlClass} placeholder="09xx-xxx-xxxx"
                  value={addForm.contact}
                  onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddPatient(false)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1">Cancel</button>
              <button type="button" onClick={() => void addPatient()} disabled={addBusy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {addBusy ? 'Creating…' : 'Create Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
