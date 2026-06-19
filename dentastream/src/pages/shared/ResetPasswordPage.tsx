import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/AuthService';

/**
 * Lands here from the password-recovery email link. Supabase auto-establishes
 * a PASSWORD_RECOVERY session from the URL fragment; we wait for that event
 * before allowing the form to submit so updateUser() has a session to act on.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // The Supabase JS client parses the URL hash on mount; the event fires
    // synchronously if a recovery session was just established.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also handle the case where the session is already present (e.g. refresh).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    const { error: updateError } = await AuthService.updatePassword(password);
    setSubmitting(false);
    if (updateError) { setError(updateError); return; }
    // Sign out the recovery session so the user logs in fresh with the new password.
    await supabase.auth.signOut();
    navigate('/login?reset=success', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-dark">Set a new password</h1>
          <p className="mt-1 text-sm text-dark-5">
            {ready ? 'Choose a password at least 8 characters long.' : 'Verifying your reset link…'}
          </p>
        </div>

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5">New password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5">Confirm password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
