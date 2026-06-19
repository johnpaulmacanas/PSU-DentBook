import { useCallback, useEffect, useState } from 'react';
import { ProfileService } from '../../services/ProfileService';
import { DoctorService } from '../../services/DoctorService';
import { controlClass } from '../../components/ui/Field';
import { supabase } from '../../lib/supabase';
import type { Doctor, Profile } from '../../types';

interface StaffRow {
  profile: Profile;
  doctor: Doctor | null;   // null => not yet provisioned
}

/**
 * Admin staff management: lists doctor/admin accounts, provisions clinical records,
 * and invites new staff via the invite-staff edge function (service_role).
 */
export function StaffPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'doctor' as 'doctor' | 'admin',
    specialty: '',
  });
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [profilesRes, doctorsRes] = await Promise.all([
      ProfileService.listByRole('doctor'),
      DoctorService.listAll(),
    ]);

    // Also load admin profiles
    const adminsRes = await ProfileService.listByRole('admin');

    if (profilesRes.error) { setError(profilesRes.error); setLoading(false); return; }
    if (doctorsRes.error) { setError(doctorsRes.error); setLoading(false); return; }

    const byProfile = new Map((doctorsRes.data ?? []).map(d => [d.profile_id, d]));
    const doctorRows = (profilesRes.data ?? []).map(p => ({ profile: p, doctor: byProfile.get(p.id) ?? null }));
    const adminRows = (adminsRes.data ?? []).map(p => ({ profile: p, doctor: null as Doctor | null }));

    setRows([...adminRows, ...doctorRows]);
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

  async function inviteStaff() {
    if (!inviteForm.email || !inviteForm.password || !inviteForm.full_name) {
      setNotice('Please fill in all required fields.');
      return;
    }

    setInviting(true);
    setNotice(null);

    const { data, error } = await supabase.functions.invoke('invite-staff', {
      body: {
        email: inviteForm.email,
        password: inviteForm.password,
        full_name: inviteForm.full_name,
        role: inviteForm.role,
        specialty: inviteForm.specialty || undefined,
      },
    });

    setInviting(false);

    if (error) {
      setNotice(`Error: ${error.message}`);
      return;
    }
    if (data?.error) {
      setNotice(`Error: ${data.error}`);
      return;
    }

    setNotice(`${inviteForm.role === 'doctor' ? 'Doctor' : 'Admin'} account created for ${inviteForm.email}!`);
    setShowInvite(false);
    setInviteForm({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Staff</h1>
          <p className="mt-1 text-sm text-dark-5">
            Manage clinic staff — invite new accounts or provision existing ones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          + Invite Staff
        </button>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">
            No staff accounts yet. Click "Invite Staff" to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-1 text-left text-xs font-semibold uppercase text-dark-5">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3">Clinical Record</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {rows.map(({ profile, doctor }) => (
                  <tr key={profile.id} className="hover:bg-gray-1">
                    <td className="px-5 py-3.5 font-medium text-dark">{profile.full_name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        profile.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {profile.role === 'admin' ? 'Admin' : 'Doctor'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-dark-5 hidden md:table-cell">{profile.contact ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      {profile.role === 'admin' ? (
                        <span className="text-xs text-dark-5">N/A</span>
                      ) : doctor ? (
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
                      {profile.role === 'admin' || doctor ? (
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

      {/* ===== Invite Staff Modal ===== */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-dark">Invite Staff Member</h2>
            <p className="mt-1 text-sm text-dark-5">
              Create a new account. They can log in immediately.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Full Name *</label>
                <input
                  className={controlClass}
                  placeholder="Dr. Jane Smith"
                  value={inviteForm.full_name}
                  onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Email *</label>
                <input
                  type="email"
                  className={controlClass}
                  placeholder="jane@dentastream.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Temporary Password *</label>
                <input
                  type="text"
                  className={controlClass}
                  placeholder="Min 6 characters"
                  value={inviteForm.password}
                  onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">Role *</label>
                <select
                  className={controlClass}
                  value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as 'doctor' | 'admin' }))}
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteForm.role === 'doctor' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-dark-5">Specialty (optional)</label>
                  <input
                    className={controlClass}
                    placeholder="e.g. Orthodontics"
                    value={inviteForm.specialty}
                    onChange={e => setInviteForm(f => ({ ...f, specialty: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void inviteStaff()}
                disabled={inviting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {inviting ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
