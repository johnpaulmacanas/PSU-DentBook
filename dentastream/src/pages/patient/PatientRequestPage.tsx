import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDoctors } from '../../hooks/useDoctors';
import { AppointmentRequestService } from '../../services/AppointmentRequestService';
import { ProfileService } from '../../services/ProfileService';
import { validateIntake, type IntakeErrors, type IntakeForm } from '../../lib/validation';
import { CONCERN_OPTIONS, concernLabel, formatMoney } from '../../lib/format';
import { estimateFee } from '../../lib/pricing';
import { Field, controlClass } from '../../components/ui/Field';
import type { Concern } from '../../types';

/**
 * Patient intake + booking request. Identity fields update the profile; the
 * concern/medical questions/consent create an appointment_request that an
 * admin then approves. Mirrors the workflow spec's Phase 1 (patient-driven).
 */
export function PatientRequestPage() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const { doctors } = useDoctors();

  const [form, setForm] = useState<IntakeForm & {
    notes: string;
    preferred_doctor_id: string;
    allergies: string;
    medications: string;
    conditions: string;
    is_pregnant: boolean;
  }>({
    full_name: profile?.full_name ?? '',
    email: user?.email ?? '',
    contact: profile?.contact ?? '',
    address: profile?.address ?? '',
    birthdate: profile?.birthdate ?? '',
    sex: profile?.sex ?? '',
    concern: '',
    consent: false,
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_number: '',
    notes: '',
    preferred_doctor_id: '',
    allergies: '',
    medications: '',
    conditions: '',
    is_pregnant: false,
  });
  const [errors, setErrors] = useState<IntakeErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateIntake(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!user || !profile) {
      setServerError('You must be signed in to submit a request.');
      return;
    }

    setSubmitting(true);

    // Persist identity fields onto the profile (best-effort; non-fatal).
    await ProfileService.update(user.id, {
      full_name: form.full_name,
      contact: form.contact,
      address: form.address || undefined,
      birthdate: form.birthdate || undefined,
      sex: (form.sex as 'M' | 'F' | 'other') || undefined,
    });

    const { error } = await AppointmentRequestService.create({
      patient_profile_id: user.id,
      concern: form.concern as Concern,
      preferred_doctor_id: form.preferred_doctor_id || null,
      notes: form.notes || undefined,
      emergency_contact_name: form.emergency_contact_name || undefined,
      emergency_contact_relation: form.emergency_contact_relation || undefined,
      emergency_contact_number: form.emergency_contact_number || undefined,
      allergies: form.allergies || undefined,
      medications: form.medications || undefined,
      conditions: form.conditions || undefined,
      is_pregnant: form.is_pregnant,
      consent: form.consent,
      estimated_amount: estimateFee(form.concern),
    });

    setSubmitting(false);

    if (error) {
      setServerError(error);
      return;
    }
    await refresh();
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-stroke bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-light/20 text-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-dark">Request submitted</h2>
          <p className="mt-2 text-sm text-dark-5">
            Your appointment request was sent to the clinic. You'll receive the
            details once an admin approves and schedules it.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/patient/appointments')}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              View My Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Request an Appointment</h1>
        <p className="mt-1 text-sm text-dark-5">
          Tell us about you and your concern. Fields marked * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Personal information */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Your Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.full_name}>
              <input className={controlClass} value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" className={controlClass} value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Phone number" required error={errors.contact}>
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
          {/* Teeth/problem photo — deferred (Supabase Storage not configured this pass). */}
          <p className="mt-3 text-xs text-dark-5">
            Photo of your teeth/problem: <span className="italic">coming soon.</span>
          </p>
        </section>

        {/* Concern + dentist */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Your Concern</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What brings you in?" required error={errors.concern}>
              <select className={controlClass} value={form.concern} onChange={e => set('concern', e.target.value as Concern | '')}>
                <option value="">Select a concern…</option>
                {CONCERN_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred dentist (optional)">
              <select className={controlClass} value={form.preferred_doctor_id} onChange={e => set('preferred_doctor_id', e.target.value)}>
                <option value="">No preference</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.profile?.full_name ?? 'Dentist'}{d.specialty ? ` — ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Anything else we should know?" className="sm:col-span-2">
              <textarea className={controlClass} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>

          {/* Initial estimate shown before the patient confirms (spec requirement). */}
          {form.concern && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-stroke bg-gray-1 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-dark">Estimated initial fee</p>
                <p className="text-xs text-dark-5">
                  For {concernLabel(form.concern)}. Final amount is confirmed by the clinic on approval.
                </p>
              </div>
              <p className="text-lg font-bold text-dark">{formatMoney(estimateFee(form.concern))}</p>
            </div>
          )}
        </section>

        {/* Medical / emergency */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Medical &amp; Emergency Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Emergency contact name">
              <input className={controlClass} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
            </Field>
            <Field label="Relationship to patient">
              <input className={controlClass} value={form.emergency_contact_relation} onChange={e => set('emergency_contact_relation', e.target.value)} />
            </Field>
            <Field label="Emergency contact number" error={errors.emergency_contact_number}>
              <input className={controlClass} value={form.emergency_contact_number} onChange={e => set('emergency_contact_number', e.target.value)} />
            </Field>
            <Field label="Known allergies">
              <input className={controlClass} value={form.allergies} onChange={e => set('allergies', e.target.value)} />
            </Field>
            <Field label="Current medications">
              <input className={controlClass} value={form.medications} onChange={e => set('medications', e.target.value)} />
            </Field>
            <Field label="Existing medical conditions">
              <input className={controlClass} value={form.conditions} onChange={e => set('conditions', e.target.value)} />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-dark">
            <input type="checkbox" checked={form.is_pregnant} onChange={e => set('is_pregnant', e.target.checked)} />
            Currently pregnant (if applicable)
          </label>
        </section>

        {/* Consent */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <label className="flex items-start gap-3 text-sm text-dark">
            <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={e => set('consent', e.target.checked)} />
            <span>
              I consent to DentaStream collecting and processing my personal and
              medical information for the purpose of this appointment. *
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-500">{errors.consent}</p>}
        </section>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/patient/appointments')}
            className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
