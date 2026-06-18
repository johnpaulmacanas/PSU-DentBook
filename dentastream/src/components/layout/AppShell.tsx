import { useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MenuIcon, LogoutIcon, ToothIcon } from './icons';

export interface NavItem {
  title: string;
  to: string;
  end?: boolean;
  Icon: ComponentType<{ className?: string }>;
}

export interface RoleAccent {
  /** Solid brand color (logo chip, avatar background). */
  hex: string;
  /** Text color shown on top of the solid brand color. */
  text: string;
  /** Soft translucent tint for the active nav item background. */
  soft: string;
}

interface AppShellProps {
  navItems: NavItem[];
  accent: RoleAccent;
  brand: string;
  roleLabel: string;
  userName: string;
  userInitial: string;
}

/**
 * Shared application shell (TailAdmin template): responsive white sidebar with a
 * mobile drawer, sticky header, and a logout control. The role palette is applied
 * via inline styles (Tailwind can't emit arbitrary runtime hex classes), so the
 * same component themes admin / doctor / patient from one source (DRY).
 */
export function AppShell({ navItems, accent, brand, roleLabel, userName, userInitial }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const activeItem = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(item.to + '/'),
  );

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed bottom-0 top-0 z-50 flex flex-col overflow-hidden border-r border-stroke bg-white transition-[width] duration-200 ease-linear',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen',
          open ? 'w-[260px]' : 'w-0 lg:w-[260px]',
        ].join(' ')}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col px-6 py-8">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: accent.hex }}>
              <ToothIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-dark">DentaStream</p>
              <p className="truncate text-xs text-dark-5">{brand}</p>
            </div>
          </div>

          <p className="mb-4 px-1 text-xs font-semibold uppercase tracking-wider text-dark-5">Main Menu</p>

          <nav className="custom-scrollbar flex-1" role="navigation" aria-label="Main">
            <ul className="space-y-1">
              {navItems.map(({ title, to, end, Icon }) => {
                const isActive = end
                  ? location.pathname === to
                  : location.pathname === to || location.pathname.startsWith(to + '/');
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={() => setOpen(false)}
                      style={isActive ? { backgroundColor: accent.soft, color: accent.text } : undefined}
                      className={[
                        'flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors duration-150',
                        isActive ? '' : 'text-dark-4 hover:bg-gray-2 hover:text-dark',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer: user + logout */}
          <div className="mt-6 border-t border-stroke pt-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: accent.soft, color: accent.text }}
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-dark">{userName}</p>
                <p className="truncate text-xs text-dark-5">{roleLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-dark-4 transition-colors hover:bg-gray-2 hover:text-dark"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen w-full flex-col bg-gray-2">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-sm md:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="rounded-lg border border-stroke p-1.5 text-dark-4 hover:bg-gray-2 lg:hidden"
              aria-label="Toggle menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-dark">{activeItem?.title ?? roleLabel}</h1>
              <p className="hidden text-xs text-dark-5 sm:block">{brand}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: accent.hex, color: accent.text }}
            >
              {userInitial}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Role palettes from the spec, exposed for the three layouts. */
export const ROLE_ACCENTS: Record<'admin' | 'doctor' | 'patient', RoleAccent> = {
  admin:   { hex: '#ffff56', text: '#4a4500', soft: 'rgba(255, 255, 86, 0.18)' },
  doctor:  { hex: '#FF00FF', text: '#4b004b', soft: 'rgba(255, 0, 255, 0.10)' },
  patient: { hex: '#75fbfd', text: '#035455', soft: 'rgba(117, 251, 253, 0.20)' },
};
