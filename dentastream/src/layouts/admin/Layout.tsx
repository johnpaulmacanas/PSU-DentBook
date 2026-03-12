import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

const NAV_ITEMS = [
  { title: 'Dashboard', to: '/', end: true, Icon: DashboardIcon },
  { title: 'Appointments', to: '/appointments', Icon: CalendarIcon },
  { title: 'Patients', to: '/patients', Icon: UsersIcon },
  { title: 'Chat', to: '/chat', Icon: ChatIcon },
  { title: 'Settings', to: '/settings', Icon: SettingsIcon },
]

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed bottom-0 top-0 z-50 flex flex-col bg-white border-r border-stroke transition-[width] duration-200 ease-linear overflow-hidden',
          'lg:sticky lg:top-0 lg:h-screen lg:z-auto',
          isOpen ? 'w-[260px]' : 'w-0 lg:w-[260px]',
        ].join(' ')}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col py-8 px-6">
          {/* Brand */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-dark">DentaStream</span>
          </div>

          {/* Nav label */}
          <p className="mb-4 px-1 text-xs font-semibold uppercase tracking-wider text-dark-5">
            Main Menu
          </p>

          {/* Nav links */}
          <nav className="flex-1 custom-scrollbar" role="navigation" aria-label="Main">
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ title, to, end, Icon }) => {
                const isActive = end
                  ? location.pathname === to
                  : location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onClose}
                      className={[
                        'flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-dark-4 hover:bg-gray-2 hover:text-dark',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{title}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="mt-6 border-t border-stroke pt-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-dark">Admin</p>
                <p className="truncate text-xs text-dark-5">DentaStream</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const pageTitle = NAV_ITEMS.find(item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.title ?? 'Admin'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-stroke p-1.5 text-dark-4 hover:bg-gray-2 lg:hidden"
          aria-label="Toggle menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="hidden xl:block">
          <h1 className="text-lg font-bold text-dark">{pageTitle}</h1>
          <p className="text-xs text-dark-5">Clinical Workflow Automation</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative hidden max-w-xs w-full sm:block">
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-full border border-stroke bg-gray-2 py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" />
        </div>

        <button className="relative rounded-full border border-stroke p-2 text-dark-4 hover:bg-gray-2" aria-label="Notifications">
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          A
        </div>
      </div>
    </header>
  )
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen w-full flex-col bg-gray-2">
        <Header onMenuClick={() => setSidebarOpen(open => !open)} />
        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
