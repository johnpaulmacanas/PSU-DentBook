import { useEffect, useMemo, useState } from 'react';
import { usePatients } from '../../hooks/usePatients';
import { PatientService } from '../../services/PatientService';
import { Field, controlClass } from '../../components/ui/Field';
import type { Patient } from '../../types';

/** Admin patient directory, wired to live data via PatientService. */
export function PatientsPage() {
  const { patients, loading, error, reload } = usePatients();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ age: '', gender: '', medical_notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync the edit form whenever the selected patient changes.
  useEffect(() => {
    setEditing(false);
    setSaveError(null);
    setForm({
      age: selected?.age != null ? String(selected.age) : '',
      gender: selected?.gender ?? '',
      medical_notes: selected?.medical_notes ?? '',
    });
  }, [selected]);

  async function savePatient() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    const { data, error } = await PatientService.update(selected.id, {
      age: form.age ? Number(form.age) : null,
      gender: (form.gender as 'M' | 'F' | 'other') || null,
      medical_notes: form.medical_notes || null,
    });
    setSaving(false);
    if (error) { setSaveError(error); return; }
    if (data) setSelected(data);
    setEditing(false);
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
      </div>

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {filtered.map(p => (
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
                    </tr>
                  ))}
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
                    Edit clinical data
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <p className="text-sm font-medium text-dark">No patient selected</p>
              <p className="mt-1 text-xs text-dark-5">Click a row to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
