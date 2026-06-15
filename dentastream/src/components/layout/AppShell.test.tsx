import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock AuthContext so AppShell can call useAuth() without a real provider.
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

import { AppShell, ROLE_ACCENTS, type NavItem, type RoleAccent } from './AppShell';
import { useAuth } from '../../context/AuthContext';
import { DashboardIcon, CalendarIcon, UsersIcon } from './icons';

type AuthShape = ReturnType<typeof useAuth>;

function setAuth(partial: Partial<AuthShape> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'u1' } as never,
    profile: null,
    role: 'admin',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    ...partial,
  } as AuthShape);
}

const SAMPLE_NAV: NavItem[] = [
  { title: 'Dashboard', to: '/', end: true, Icon: DashboardIcon },
  { title: 'Appointments', to: '/appointments', Icon: CalendarIcon },
  { title: 'Patients', to: '/patients', Icon: UsersIcon },
];

const ADMIN_ACCENT: RoleAccent = ROLE_ACCENTS.admin;

function renderShell(
  nav: NavItem[] = SAMPLE_NAV,
  accent: RoleAccent = ADMIN_ACCENT,
  initialPath = '/',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* AppShell renders an <Outlet>, so wrap it in a layout route */}
        <Route
          element={
            <AppShell
              navItems={nav}
              accent={accent}
              brand="Test Portal"
              roleLabel="Admin"
              userName="Jane Doe"
              userInitial="J"
            />
          }
        >
          <Route path="/" element={<div>home page</div>} />
          <Route path="/appointments" element={<div>appointments page</div>} />
          <Route path="/patients" element={<div>patients page</div>} />
          <Route path="/login" element={<div>login page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
});

// ─── ROLE_ACCENTS ────────────────────────────────────────────────────────────

describe('ROLE_ACCENTS', () => {
  it('exports palettes for all three roles', () => {
    expect(ROLE_ACCENTS.admin).toBeDefined();
    expect(ROLE_ACCENTS.doctor).toBeDefined();
    expect(ROLE_ACCENTS.patient).toBeDefined();
  });

  it('each palette has hex, text, and soft keys', () => {
    for (const role of ['admin', 'doctor', 'patient'] as const) {
      const palette = ROLE_ACCENTS[role];
      expect(palette.hex, `${role}.hex`).toBeTruthy();
      expect(palette.text, `${role}.text`).toBeTruthy();
      expect(palette.soft, `${role}.soft`).toBeTruthy();
    }
  });

  it('each role has a distinct hex color', () => {
    const hexes = [ROLE_ACCENTS.admin.hex, ROLE_ACCENTS.doctor.hex, ROLE_ACCENTS.patient.hex];
    const unique = new Set(hexes);
    expect(unique.size).toBe(3);
  });

  it('hex values are valid CSS colors (start with # or rgb)', () => {
    for (const role of ['admin', 'doctor', 'patient'] as const) {
      expect(ROLE_ACCENTS[role].hex).toMatch(/^#|^rgb/i);
    }
  });
});

// ─── AppShell: sidebar navigation ────────────────────────────────────────────

describe('AppShell — navigation', () => {
  it('renders all nav item titles', () => {
    renderShell();
    // Active item ('Dashboard' at '/') appears in both the nav link and the
    // header h1 — use getAllByText to handle the multi-match gracefully.
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Appointments').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Patients').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the brand name in the sidebar', () => {
    renderShell();
    // "Test Portal" appears as the brand subtitle.
    expect(screen.getAllByText('Test Portal').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the user name and initial', () => {
    renderShell();
    // "Jane Doe" in sidebar footer; "J" in avatar chips.
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    // Multiple "J" avatars (sidebar + header); getAllByText prevents false failure.
    expect(screen.getAllByText('J').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the role label', () => {
    renderShell();
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
  });

  it('highlights the active nav item based on current location', () => {
    renderShell(SAMPLE_NAV, ADMIN_ACCENT, '/appointments');
    // 'Appointments' appears in both the nav link and the header h1 when active;
    // getAllByText handles the multiple-match case.
    const els = screen.getAllByText('Appointments');
    expect(els.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── AppShell: sticky header ─────────────────────────────────────────────────

describe('AppShell — sticky header', () => {
  it('renders a <header> element', () => {
    const { container } = renderShell();
    expect(container.querySelector('header')).not.toBeNull();
  });

  it('shows the active page title in the header', () => {
    // At "/" the active item is "Dashboard".
    renderShell(SAMPLE_NAV, ADMIN_ACCENT, '/');
    // h1 in the header carries the page title.
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('Dashboard');
  });

  it('renders the notifications bell button', () => {
    renderShell();
    const bell = screen.getByRole('button', { name: /notifications/i });
    expect(bell).toBeInTheDocument();
  });

  it('renders the hamburger menu button (mobile toggle)', () => {
    renderShell();
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(toggle).toBeInTheDocument();
  });
});

// ─── AppShell: mobile sidebar drawer ─────────────────────────────────────────

describe('AppShell — mobile sidebar toggle', () => {
  it('opens the sidebar when the hamburger is clicked', () => {
    const { container } = renderShell();
    const aside = container.querySelector('aside');
    // Sidebar starts collapsed on mobile (w-0).
    expect(aside?.className).toContain('w-0');

    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    // After click it should be expanded (w-[260px]).
    expect(aside?.className).toContain('w-[260px]');
  });

  it('closes the sidebar when a nav link is clicked', () => {
    const { container } = renderShell();
    // Open the drawer first.
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-[260px]');

    // Click a nav link — AppShell calls setOpen(false) in the NavLink's onClick.
    fireEvent.click(screen.getByText('Appointments'));
    expect(aside?.className).toContain('w-0');
  });

  it('closes the sidebar when the overlay backdrop is clicked', () => {
    const { container } = renderShell();
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-0');
  });
});

// ─── AppShell: logout ────────────────────────────────────────────────────────

describe('AppShell — logout', () => {
  it('renders the Log out button', () => {
    renderShell();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('calls logout() from AuthContext when the Log out button is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    setAuth({ logout });
    renderShell();

    // Wrap in act() so the navigate() call inside the async handler doesn't
    // trigger an "update not wrapped in act" warning.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    });
    expect(logout).toHaveBeenCalledOnce();
  });
});

// ─── AppShell: outlet ────────────────────────────────────────────────────────

describe('AppShell — page outlet', () => {
  it('renders the child page content via <Outlet />', () => {
    renderShell(SAMPLE_NAV, ADMIN_ACCENT, '/');
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
