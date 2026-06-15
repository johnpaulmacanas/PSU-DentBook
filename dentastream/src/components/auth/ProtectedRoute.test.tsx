import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

type AuthShape = ReturnType<typeof useAuth>;

function setAuth(partial: Partial<AuthShape>) {
  vi.mocked(useAuth).mockReturnValue({
    user: null, profile: null, role: null, loading: false,
    login: vi.fn(), logout: vi.fn(), refresh: vi.fn(),
    ...partial,
  } as AuthShape);
}

function renderAt(initial: string, allowedRoles?: ('admin' | 'doctor' | 'patient')[]) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/" element={<div>admin home</div>} />
        <Route path="/doctor" element={<div>doctor home</div>} />
        <Route path="/patient" element={<div>patient home</div>} />
        <Route
          path="/secret"
          element={<ProtectedRoute allowedRoles={allowedRoles}><div>secret content</div></ProtectedRoute>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ProtectedRoute', () => {
  it('shows a spinner while auth is loading', () => {
    setAuth({ loading: true });
    const { container } = renderAt('/secret');
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirects unauthenticated users to /login', () => {
    setAuth({ user: null });
    renderAt('/secret', ['admin']);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders children for an allowed role', () => {
    setAuth({ user: { id: 'u1' } as never, role: 'admin' });
    renderAt('/secret', ['admin']);
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('redirects a wrong-role user to their own home', () => {
    setAuth({ user: { id: 'u1' } as never, role: 'patient' });
    renderAt('/secret', ['admin']);
    expect(screen.getByText('patient home')).toBeInTheDocument();
  });
});
