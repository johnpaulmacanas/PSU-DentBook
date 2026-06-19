import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Don't surface per-email errors — that would leak account existence.
    await AuthService.requestPasswordReset(email);
    setSubmitting(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-dark">Reset your password</h1>
          <p className="mt-1 text-sm text-dark-5">
            We'll email you a secure link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-green-light/20 px-4 py-3 text-sm text-green">
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
            Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark-5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-dark-5">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
