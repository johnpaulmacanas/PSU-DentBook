import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

function homeForRole(role: UserRole | null): string {
  return role === 'doctor' ? '/doctor'
    : role === 'patient' ? '/patient'
    : '/';
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: loginError, role } = await login(email, password);
    setLoading(false);
    if (loginError) { setError(loginError); return; }
    // Navigate using the role returned by the login call (deterministic).
    navigate(homeForRole(role), { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-white p-8 shadow-sm">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffff56]">
            <svg viewBox="0 0 24 24" fill="#4a4500" className="h-6 w-6">
              <path d="M12 2C8 2 5 5.5 5 9c0 2.5 1 4.5 2.5 5.5L8 21h8l.5-6.5C18 13.5 19 11.5 19 9c0-3.5-3-7-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dark">DentaStream</h1>
          <p className="mt-1 text-sm text-dark-5">Sign in to your clinic portal</p>
        </div>

        {resetSuccess && (
          <p className="mb-4 rounded-lg bg-green-light/20 px-3 py-2 text-xs text-green">
            Password updated. Sign in with your new password.
          </p>
        )}

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

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-dark-5">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-dark-5">
          No account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
