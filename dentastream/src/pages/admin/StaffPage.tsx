import { useCallback, useEffect, useState } from 'react';
import { ProfileService } from '../../services/ProfileService';
import { DoctorService } from '../../services/DoctorService';
import { controlClass } from '../../components/ui/Field';
import type { Doctor, Profile } from '../../types';

interface StaffRow {
  profile: Profile;
  doctor: Doctor | null;   // null => not yet provisioned
}

/**
 * Admin staff management: lists doctor-role accounts and provisions the clinical
 * `doctors` row they need to appear in the dentist picker and see a schedule.
 * (New login accounts are created at /signup — the anon client can't admin-create
 * auth users.)
 */
export function StaffPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [profilesRes, doctorsRes] = await Promise.all([
      ProfileService.listByRole('doctor'),
      DoctorService.listAll(),
    ]);
    if (profilesRes.error) { setError(profilesRes.error); setLoading(false); return; }
    if (doctorsRes.error) { setError(doctorsRes.error); setLoading(false); return; }
    const byProfile = new Map((doctorsRes.data ?? []).map(d => [d.profile_id, d]));
    setRows((profilesRes.data ?? []).map(p => ({ profile: p, doctor: byProfile.get(p.id) ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function provision(profileId: string) {
    setBusyId(profileId);
    const { error } = await DoctorService.create({
      profile_id: profileId,
      specialty: specialty[profileId]?.trim() || undefined,
    });
    setBusyId(null);
    if (error) { setError(error); return; }
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Staff</h1>
        <p className="mt-1 text-sm text-dark-5">
          Provision clinical records for dentist accounts. New accounts sign up at{' '}
          <span className="font-medium text-dark">/signup</span> with the Doctor role.
        </p>
      </div>

      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">
            No dentist accounts yet. Create one at /signup with the Doctor role.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Dentist</th>
                  <th className="px-5 py-3 hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3">Clinical record</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {rows.map(({ profile, doctor }) => (
                  <tr key={profile.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">{profile.full_name}</td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{profile.contact ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      {doctor ? (
                        <span className="inline-block rounded-full bg-green-light/20 px-2.5 py-1 text-xs font-medium text-green">
                          Active{doctor.specialty ? ` · ${doctor.specialty}` : ''}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                          Not provisioned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {doctor ? (
                        <p className="text-right text-xs text-dark-5">—</p>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            className={[controlClass, 'max-w-[150px] py-1.5'].join(' ')}
                            placeholder="Specialty (optional)"
                            value={specialty[profile.id] ?? ''}
                            onChange={e => setSpecialty(s => ({ ...s, [profile.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            disabled={busyId === profile.id}
                            onClick={() => void provision(profile.id)}
                            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                          >
                            {busyId === profile.id ? 'Adding…' : 'Provision'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
