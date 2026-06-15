import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

import { LoginPage } from './LoginPage';
import { useAuth } from '../../context/AuthContext';

const loginMock = vi.fn();

function setup() {
  vi.mocked(useAuth).mockReturnValue({
    user: null, profile: null, role: null, loading: false,
    login: loginMock, logout: vi.fn(), refresh: vi.fn(),
  } as ReturnType<typeof useAuth>);
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
}

beforeEach(() => vi.clearAllMocks());

describe('LoginPage', () => {
  it('logs in and navigates to the role home on success', async () => {
    loginMock.mockResolvedValue({ error: null, role: 'doctor' });
    setup();

    await userEvent.type(screen.getByPlaceholderText('you@clinic.com'), 'doc@clinic.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith('doc@clinic.com', 'secret123'),
    );
    expect(navigateMock).toHaveBeenCalledWith('/doctor', { replace: true });
  });

  it('shows an error and does not navigate on failure', async () => {
    loginMock.mockResolvedValue({ error: 'Invalid login credentials', role: null });
    setup();

    await userEvent.type(screen.getByPlaceholderText('you@clinic.com'), 'bad@clinic.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
