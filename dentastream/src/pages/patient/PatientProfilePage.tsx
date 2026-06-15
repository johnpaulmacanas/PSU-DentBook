import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/ProfileService';
import { Field, controlClass } from '../../components/ui/Field';

/** Editable patient profile (identity + contact details). */
export function PatientProfilePage() {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    contact: profile?.contact ?? '',
    address: profile?.address ?? '',
    birthdate: profile?.birthdate ?? '',
    sex: profile?.sex ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const { error } = await ProfileService.update(user.id, {
      full_name: form.full_name,
      contact: form.contact,
      address: form.address || undefined,
      birthdate: form.birthdate || undefined,
      sex: (form.sex as 'M' | 'F' | 'other') || undefined,
    });
    setSaving(false);
    if (error) { setError(error); return; }
    await refresh();
    setMessage('Profile updated.');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Profile</h1>
        <p className="mt-1 text-sm text-dark-5">Keep your contact details up to date.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-dark">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className={controlClass} value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={[controlClass, 'opacity-60'].join(' ')} value={user?.email ?? ''} disabled />
          </Field>
          <Field label="Phone number">
            <input className={controlClass} value={form.contact} onChange={e => set('contact', e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={controlClass} value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="Birthdate">
            <input type="date" className={controlClass} value={form.birthdate} onChange={e => set('birthdate', e.target.value)} />
          </Field>
          <Field label="Sex">
            <select className={controlClass} value={form.sex} onChange={e => set('sex', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        {message && <p className="mt-4 rounded-lg bg-green-light/20 px-3 py-2 text-sm text-green">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
